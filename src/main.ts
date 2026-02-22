import { NodeHttpClient, NodeRuntime } from '@effect/platform-node'
import { Config, Duration, Effect, Layer, Logger, LogLevel, Option, PubSub, Redacted, Stream } from 'effect'
import { MatrixConfig } from 'mxfx'
import { MatrixApi, endpoints } from 'mxfx/api'
import { InMemoryVault, Vault } from 'mxfx/vault'
import { RoomId, UserId } from 'mxfx/branded'
import type { ClientEventWithoutRoomIdSchema, RoomMessageEventSchema } from '../packages/mxfx/src/api/schema/common'

function typedEntries<T extends Record<string, any>>(obj: T): { [K in keyof T]: [K, T[K]] }[keyof T][] {
  return Object.entries(obj) as any
}

function isRoomMessageEvent(event: typeof ClientEventWithoutRoomIdSchema.Type): event is typeof RoomMessageEventSchema.Type {
  return event.type === 'm.room.message'
}

const program = Effect.gen(function* () {
  const matrixUserName = yield* Config.string('MATRIX_USER_NAME')
  const matrixUserPassword = yield* Config.redacted('MATRIX_USER_PASSWORD')

  const matrixConfig = yield* MatrixConfig.MatrixConfig
  yield* Effect.log({ matrixUserName, matrixUserPassword, matrixBaseUrl: matrixConfig.baseUrl })

  const matrixApi = yield* MatrixApi
  const vault = yield* Vault

  const userId = yield* UserId.make(`@${matrixUserName}:${matrixConfig.serverName}`)
  const accessToken = yield* vault.getItem('accessToken')

  if (Option.isNone(accessToken)) {
    yield* Effect.log('No access token found in vault, logging in...')
    const loginResult = yield* endpoints
      .postLoginV3({
        type: 'm.login.password',
        password: Redacted.value(matrixUserPassword),
        identifier: { type: 'm.id.user', user: matrixUserName },
        initialDeviceDisplayName: 'mxfx-client',
      })
      .pipe(Effect.andThen(matrixApi.execute))

    yield* vault.setItem('accessToken', loginResult.accessToken)
    yield* Effect.log('Login successful, access token stored in vault', loginResult.accessToken)
  }

  const y = yield* endpoints.getProfileV3({ userId }).pipe(Effect.andThen(matrixApi.execute))
  yield* Effect.log(`Logged in as user ID: ${userId} with profile: ${JSON.stringify(y)}`)

  const syncHub = yield* PubSub.unbounded<typeof endpoints.getSyncV3ResponseSchema.Type>()

  yield* Stream.fromPubSub(syncHub).pipe(
    Stream.runForEach(sync => Effect.log(`Received sync response: ${JSON.stringify(sync)}`)),
    Effect.fork,
  )

  yield* Stream.fromPubSub(syncHub).pipe(
    Stream.filterMap(sync => Option.fromNullable(sync.rooms?.invite)),
    Stream.mapConcat(invites => Object.entries(invites)),
    Stream.runForEach(([roomId]) =>
      RoomId.make(roomId).pipe(
        Effect.andThen(roomId => endpoints.postRoomsJoinV3({ roomId })),
        Effect.andThen(matrixApi.execute),
        Effect.andThen(() => Effect.log(`Joined room ${roomId} that we were invited to`)),
        Effect.catchAll(err => Effect.logError(`Failed to join room ${roomId}: ${err}`)),
      ),
    ),
    Effect.fork,
  )

  yield* Stream.fromPubSub(syncHub).pipe(
    Stream.filterMap(sync => Option.fromNullable(sync.rooms?.join)),
    Stream.mapConcat(joinedRooms => typedEntries(joinedRooms)),
    Stream.filterMap(([roomId, roomData]) =>
      Option.fromNullable(roomData.timeline?.events).pipe(Option.map(events => ({ roomId, events }))),
    ),
    Stream.mapConcat(({ roomId, events }) => events.map(event => ({ roomId, event }))),
    Stream.filterMap(({ roomId, event }) => Option.liftPredicate(isRoomMessageEvent)(event).pipe(Option.map(event => ({ roomId, event })))),
    Stream.runForEach(({ roomId, event }) =>
      Effect.gen(function* () {
        yield* Effect.log(`Received message ${event.content.body} in room ${roomId}: ${JSON.stringify(event)}`)
        if (event.content.body === '!ping') {
          const responseContent = { msgtype: 'm.text', body: 'Pinging...' }
          const { eventId } = yield* endpoints
            .putRoomsSendV3({ roomId, content: responseContent, eventType: 'm.room.message' })
            .pipe(Effect.andThen(matrixApi.execute))
          const pingMs = Date.now() - event.originServerTs
          yield* endpoints
            .putRoomsSendV3({
              roomId,
              content: {
                msgtype: 'm.text',
                body: `* Pong! 🏓 ${pingMs}ms`,
                'm.newContent': { msgtype: 'm.text', body: `Pong! 🏓 ${pingMs}ms` },
                'm.relatesTo': { relType: 'm.replace', eventId },
              },
              eventType: 'm.room.message',
            })
            .pipe(Effect.andThen(matrixApi.execute))
        }
      }),
    ),
    Effect.fork,
  )

  const syncLoop = Effect.iterate(
    { nextBatch: Option.none<string>() },
    {
      body: ({ nextBatch }) =>
        endpoints
          .getSyncV3({
            timeout: Duration.seconds(30),
            since: nextBatch.pipe(Option.getOrUndefined),
            fullState: nextBatch.pipe(Option.isNone),
            filter: nextBatch.pipe(Option.match({ onNone: () => '{"room":{"timeline":{"limit":0}}}', onSome: () => undefined })),
          })
          .pipe(
            Effect.andThen(matrixApi.execute),
            Effect.tap(syncResponse => PubSub.publish(syncHub, syncResponse)),
            Effect.andThen(syncResponse => ({ nextBatch: Option.some(syncResponse.nextBatch) })),
          ),
      while: () => true,
    },
  )

  const syncLoopFiber = yield* Effect.forkDaemon(syncLoop)
  yield* syncLoopFiber.await
})

const mxfxLive = MatrixApi.Default.pipe(
  Layer.provideMerge(InMemoryVault.layerConfig({ values: { accessToken: Config.string('MATRIX_ACCESS_TOKEN') } })),
  Layer.provideMerge(MatrixConfig.layerConfig({ serverName: Config.string('MATRIX_HOME_SERVER') })),
  Layer.provide(NodeHttpClient.layer),
)

NodeRuntime.runMain(program.pipe(Effect.scoped, Effect.provide(mxfxLive), Logger.withMinimumLogLevel(LogLevel.Debug)))

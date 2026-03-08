import { NodeHttpClient, NodeRuntime } from '@effect/platform-node'
import { Config, Duration, Effect, Layer, Logger, Option, PubSub, Redacted, Result, Stream } from 'effect'
import { MatrixConfig } from 'mxfx'
import { MatrixApi, endpoints } from 'mxfx/api'
import { InMemoryVault, Vault } from 'mxfx/vault'
import { EventId, RoomId, UserId } from 'mxfx/branded'
import type { ClientEventWithoutRoomId, RoomMessageEvent } from '../packages/mxfx/src/api/schema/common'
import { DevTools } from 'effect/unstable/devtools'

function typedEntries<T extends Record<string, any>>(obj: T): { [K in keyof T]: [K, T[K]] }[keyof T][] {
  return Object.entries(obj) as any
}

function isRoomMessageEvent(event: typeof ClientEventWithoutRoomId.Encoded): event is typeof RoomMessageEvent.Encoded {
  return event.type === 'm.room.message'
}

const program = Effect.gen(function* () {
  const matrixUserName = yield* Config.string('MATRIX_USER_NAME')
  const matrixUserPassword = yield* Config.redacted('MATRIX_USER_PASSWORD')

  yield* Effect.logDebug(`Starting mxfx client with user: ${matrixUserName} on server: ${yield* Config.string('MATRIX_HOME_SERVER')}`)

  const matrixConfig = yield* MatrixConfig.MatrixConfig
  yield* Effect.log({ matrixUserName, matrixUserPassword, matrixBaseUrl: matrixConfig.baseUrl })

  const matrixApi = yield* MatrixApi.MatrixApi
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
    Effect.forkChild,
  )

  yield* Stream.fromPubSub(syncHub).pipe(
    Stream.filterMap(sync => Result.fromNullishOr(sync.rooms?.invite, () => 'No invites')),
    Stream.map(invites => Object.entries(invites)),
    Stream.flatMap(invitesEntries => Stream.fromArray(invitesEntries)),
    Stream.runForEach(([roomId]) =>
      RoomId.make(roomId).pipe(
        Effect.andThen(roomId => endpoints.postRoomsJoinV3({ roomId })),
        Effect.andThen(matrixApi.execute),
        Effect.andThen(() => Effect.log(`Joined room ${roomId} that we were invited to`)),
        Effect.catch(err => Effect.logError(`Failed to join room ${roomId}: ${err}`)),
      ),
    ),
    Effect.forkChild,
  )

  yield* Stream.fromPubSub(syncHub).pipe(
    Stream.filterMap(sync => Result.fromNullishOr(sync.rooms?.join, () => 'No joined rooms')),
    Stream.map(joinedRooms => typedEntries(joinedRooms)),
    Stream.flatMap(joinedRoomsEntries => Stream.fromArray(joinedRoomsEntries)),

    Stream.filterMap(([roomId, roomData]) =>
      Result.fromNullishOr(roomData.timeline?.events, () => 'No timeline events').pipe(Result.map(events => ({ roomId, events }))),
    ),
    Stream.map(({ roomId, events }) => ({ roomId, events: events.filter(event => event.type === 'm.room.message') })),
    Stream.flatMap(({ roomId, events }) => Stream.fromArray(events).pipe(Stream.map(event => ({ roomId, event })))),
    Stream.filterMap(({ roomId, event }) =>
      Result.liftPredicate(isRoomMessageEvent, () => 'not room message')(event).pipe(Result.map(event => ({ roomId, event }))),
    ),
    Stream.runForEach(
      Effect.fn('handleRoomMessage')(function* ({ roomId, event }) {
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
    Effect.forkChild,
  )

  let nextBatch = Option.none<string>()
  //TODO: what happened to Effect.iterate 😢
  yield* Effect.whileLoop({
    step: () => true,
    while: () => true,
    body: () =>
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
          Effect.map(syncResponse => {
            nextBatch = Option.some(syncResponse.nextBatch)
          }),
        ),
  })
})

const mxfxLive = MatrixApi.layer.pipe(
  Layer.provideMerge(DevTools.layer()),
  Layer.provideMerge(InMemoryVault.layerConfig({ values: { accessToken: Config.string('MATRIX_ACCESS_TOKEN') } })),
  Layer.provideMerge(MatrixConfig.layerConfig({ serverName: Config.string('MATRIX_HOME_SERVER') })),
  Layer.provide(NodeHttpClient.layerUndici),
  // Layer.provideMerge(Logger.layer([Logger.consoleStructured], {}))
)

NodeRuntime.runMain(program.pipe(Effect.scoped, Effect.provide(mxfxLive)))

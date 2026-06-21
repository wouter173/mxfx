import { NodeHttpClient, NodeRuntime } from '@effect/platform-node'
import { describe, it } from '@effect/vitest'
import { Cause, Config, Effect, Layer, References, Stream } from 'effect'
import { DevTools } from 'effect/unstable/devtools'
import { MatrixApi, MatrixAuth, MatrixClient, MatrixConfig, RoomId } from 'mxfx'

import { endpoints } from '../api'
import { Store } from '../store'

type SyncFrame = typeof endpoints.getSyncV3ResponseSchema.Type
const lastPredicate = (frame: Stream.Stream<SyncFrame>) =>
  frame.pipe(
    Stream.flatMap(sync => Stream.fromIterable(Object.entries(sync.rooms?.join ?? {}))),
    Stream.flatMap(([roomId, room]) =>
      Stream.fromIterable(room.timeline?.events ?? []).pipe(Stream.map(event => ({ ...event, roomId: roomId as RoomId }))),
    ),
    Stream.filterEffect(event =>
      Effect.gen(function* () {
        yield* Effect.logDebug(event)
        if (event.type !== 'm.room.message') return false
        if (typeof event.content !== 'object' || event.content === null) return false

        const content = event.content as { msgtype?: unknown; body?: unknown }

        return (
          typeof content.body === 'string' &&
          content.body.trim().startsWith('!last') &&
          (content.msgtype === 'm.text' || content.msgtype === 'm.notice' || content.msgtype === 'm.emote')
        )
      }),
    ),
  )

const program = Effect.gen(function* () {
  const api = yield* MatrixApi.MatrixApi
  const client = yield* MatrixClient.MatrixClient
  const store = yield* Store

  const { userId, deviceId, isGuest } = yield* endpoints.getAccountWhoami().pipe(Effect.andThen(api.execute))
  yield* Effect.logDebug({ userId, deviceId, isGuest })

  yield* client.onEvent({ predicate: lastPredicate }, event =>
    Effect.gen(function* () {
      const timeline = yield* store.getRoomTimeline(event.roomId)
      const lastMessages = timeline.filter(e => e.type === 'm.room.message' && e.sender !== userId).slice(-5)
      yield* Effect.log(lastMessages)

      yield* endpoints
        .putRoomsSendV3({
          content: { msgtype: 'm.text', body: lastMessages.map(x => `${x.content['body']}`).join('\n\n') },
          eventType: 'm.room.message',
          roomId: event.roomId,
        })
        .pipe(Effect.andThen(api.execute))
    }).pipe(Effect.catchCause(cause => Effect.log(cause))),
  )

  yield* client.syncLoop().pipe(
    Effect.catchCause(cause => Effect.logError(Cause.pretty(cause))),
    Effect.forkDetach(),
  )

  yield* Effect.log('Hello world')
})

const mxfxLive = MatrixClient.layerMatrixClient.pipe(
  Layer.provideMerge(MatrixApi.layer),
  Layer.provideMerge(MatrixAuth.layerLegacyConfig({ accessToken: Config.string('MATRIX_ACCESS_TOKEN') })),
  Layer.provideMerge(MatrixConfig.layerConfig({ serverName: Config.string('MATRIX_HOME_SERVER') })),
  Layer.provideMerge(NodeHttpClient.layerNodeHttp),
  Layer.provideMerge(DevTools.layer()),
  // Layer.provideMerge(Logger.layer([Logger.consoleStructured])),
  Layer.provideMerge(Layer.succeed(References.MinimumLogLevel, 'Debug')),
)

describe('event schema', () => {
  it(
    'runmain',
    async () => {
      NodeRuntime.runMain(program.pipe(Effect.provide(mxfxLive)))

      await new Promise(res => setTimeout(res, 60000))
    },
    { timeout: 60000 },
  )
})

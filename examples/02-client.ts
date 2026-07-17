import { NodeHttpClient, NodeRuntime } from '@effect/platform-node'
import { Cause, Config, Effect, Layer, References, Schema } from 'effect'
import { DevTools } from 'effect/unstable/devtools'
import { MatrixApi, MatrixAuth, MatrixClient, MatrixConfig, Store } from 'mxfx'
import { endpoints } from 'mxfx/api'

const lastEvent = MatrixClient.makeEvent({
  type: 'm.room.message',
  bucket: 'rooms.joined',
  schema: Schema.Struct({
    msgtype: Schema.Union([Schema.Literal('m.text'), Schema.Literal('m.notice'), Schema.Literal('m.emote')]),
    body: Schema.String,
  }),
  predicate: event => event.content.body.trim().startsWith('!last'),
})

const program = Effect.gen(function* () {
  const api = yield* MatrixApi.MatrixApi
  const client = yield* MatrixClient.MatrixClient
  const store = yield* Store.Store

  const { userId, deviceId, isGuest } = yield* endpoints.getAccountWhoami().pipe(Effect.andThen(api.execute))
  yield* Effect.logDebug({ userId, deviceId, isGuest })

  yield* client.onEvent(lastEvent, event =>
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

NodeRuntime.runMain(program.pipe(Effect.provide(mxfxLive)))

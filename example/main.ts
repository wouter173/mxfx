import { Config, Effect, Layer, Schema } from 'effect'
import { DevTools } from 'effect/unstable/devtools'
import { MatrixApi, endpoints } from 'mxfx/api'
import { RoomId } from 'mxfx/branded'
import { MatrixConfig } from 'mxfx/config'
import { InMemoryVault } from 'mxfx/vault'

import { MatrixClient } from './client'

const PingCommandEvent = makeEvent('mxfx.ping', {
  kind: MatrixEventKind.Timeline,
  content: Schema.Struct({
    message: Schema.String,
  }),
  predicate: (event): event is typeof Common.RoomMessageEvent.Encoded => {
    return event.type === 'mxfx.ping'
  },
})

const program = Effect.gen(function* () {
  const matrixApi = yield* MatrixApi.MatrixApi

  const client = MatrixClient.make()
  // .builder() //
  // .registerEvent(PingCommandEvent)
  // .build()

  const { userId } = yield* client.login()

  const y = yield* endpoints.getProfileV3({ userId }).pipe(Effect.andThen(matrixApi.execute))
  yield* Effect.log(`Logged in as user ID: ${userId} with profile: ${JSON.stringify(y)}`)

  yield* client.on(
    MatrixInviteEvent,
    Effect.fn('invite')(function* (invite) {
      const roomId = yield* RoomId.make(invite.roomId)
      yield* endpoints.postRoomsJoinV3({ roomId }).pipe(Effect.andThen(matrixApi.execute))
      yield* Effect.log(`Joined room ${roomId} that we were invited to`)
    }),
    Effect.catch(err => Effect.logError(`Failed to join room ${err}`)),
  )

  yield* client.on(
    PingCommandEvent,
    Effect.fn('ping')(function* (event) {
      const roomId = yield* RoomId.make(event.roomId)

      const responseContent = { msgtype: 'm.text', body: 'Pinging...' }
      const { eventId: sendEventId } = yield* endpoints
        .putRoomsSendV3({ roomId, content: responseContent, eventType: 'm.room.message' })
        .pipe(Effect.andThen(matrixApi.execute))

      const pingMs = Date.now() - event.originServerTs
      const { eventId: editEventId } = yield* endpoints
        .putRoomsSendV3({
          roomId,
          content: {
            msgtype: 'm.text',
            body: `* Pong! 🏓 ${pingMs}ms`,
            'm.newContent': { msgtype: 'm.text', body: `Pong! 🏓 ${pingMs}ms` },
            'm.relatesTo': { relType: 'm.replace', eventId: sendEventId },
          },
          eventType: 'm.room.message',
        })
        .pipe(Effect.andThen(matrixApi.execute))

      const sendEvent = yield* endpoints.getRoomsEventV3({ roomId, eventId: sendEventId }).pipe(Effect.andThen(matrixApi.execute))
      const editEvent = yield* endpoints.getRoomsEventV3({ roomId, eventId: editEventId }).pipe(Effect.andThen(matrixApi.execute))

      const fullRTT = editEvent.originServerTs - sendEvent.originServerTs

      yield* endpoints
        .putRoomsSendV3({
          roomId,
          content: {
            msgtype: 'm.text',
            body: `* Pong! 🏓 ${pingMs}ms`,
            'm.newContent': { msgtype: 'm.text', body: `Pong! 🏓 ${pingMs}ms | fullRTT: ${fullRTT}ms` },
            'm.relatesTo': { relType: 'm.replace', eventId: sendEventId },
          },
          eventType: 'm.room.message',
        })
        .pipe(Effect.andThen(matrixApi.execute))
    }),
    Effect.catch(err => Effect.logError(`Failed to ping room ${err}`)),
  )
})

const mxfxLive = MatrixApi.layer.pipe(
  Layer.provideMerge(InMemoryVault.layerConfig({ values: { accessToken: Config.string('MATRIX_ACCESS_TOKEN') } })),
  Layer.provideMerge(MatrixConfig.layerConfig({ serverName: Config.string('MATRIX_HOME_SERVER') })),

  Layer.provideMerge(DevTools.layer()),
  // Layer.provideMerge(Logger.layer([Logger.consoleStructured])),
)

NodeRuntime.runMain(program.pipe(Effect.provide(mxfxLive)))

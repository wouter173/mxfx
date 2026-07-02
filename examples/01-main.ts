// import { NodeHttpClient, NodeRuntime } from '@effect/platform-node'
// import { Config, Effect, Layer, Schema } from 'effect'
// import { DevTools } from 'effect/unstable/devtools'
// import { MatrixApi, MatrixAuth, MatrixClient, MatrixConfig, Vault } from 'mxfx'

// import { endpoints } from '../src/api'
// import { RoomId } from '../src/branded'

// // const PingCommandEvent = makeEvent('mxfx.ping', {
// //   kind: MatrixEventKind.Timeline,
// //   content: Schema.Struct({
// //     message: Schema.String,
// //   }),
// //   predicate: (event): event is typeof Common.RoomMessageEvent.Encoded => {
// //     return event.type === 'mxfx.ping'
// //   },
// // })

// const program = Effect.gen(function* () {
//   const api = yield* MatrixApi.MatrixApi
//   const client = yield* MatrixClient.MatrixClient

//   // const { userId } = yield* client.login()

//   // const y = yield* endpoints.getProfileV3({ userId }).pipe(Effect.andThen(api.execute))
//   // yield* Effect.log(`Logged in as user ID: ${userId} with profile: ${JSON.stringify(y)}`)

//   // yield* client.on(
//   //   MatrixInviteEvent,
//   //   Effect.fn('invite')(function* (invite) {
//   //     const roomId = yield* RoomId.make(invite.roomId)
//   //     yield* endpoints.postRoomsJoinV3({ roomId }).pipe(Effect.andThen(api.execute))
//   //     yield* Effect.log(`Joined room ${roomId} that we were invited to`)
//   //   }),
//   //   Effect.catch(err => Effect.logError(`Failed to join room ${err}`)),
//   // )

//   // yield* client.on(
//   //   PingCommandEvent,
//   //   Effect.fn('ping')(function* (event) {
//   //     const roomId = yield* RoomId.make(event.roomId)

//   //     const responseContent = { msgtype: 'm.text', body: 'Pinging...' }
//   //     const { eventId: sendEventId } = yield* endpoints
//   //       .putRoomsSendV3({ roomId, content: responseContent, eventType: 'm.room.message' })
//   //       .pipe(Effect.andThen(api.execute))

//   //     const pingMs = Date.now() - event.originServerTs
//   //     const { eventId: editEventId } = yield* endpoints
//   //       .putRoomsSendV3({
//   //         roomId,
//   //         content: {
//   //           msgtype: 'm.text',
//   //           body: `* Pong! 🏓 ${pingMs}ms`,
//   //           'm.newContent': { msgtype: 'm.text', body: `Pong! 🏓 ${pingMs}ms` },
//   //           'm.relatesTo': { relType: 'm.replace', eventId: sendEventId },
//   //         },
//   //         eventType: 'm.room.message',
//   //       })
//   //       .pipe(Effect.andThen(api.execute))

//   //     const sendEvent = yield* endpoints.getRoomsEventV3({ roomId, eventId: sendEventId }).pipe(Effect.andThen(api.execute))
//   //     const editEvent = yield* endpoints.getRoomsEventV3({ roomId, eventId: editEventId }).pipe(Effect.andThen(api.execute))

//   //     const fullRTT = editEvent.originServerTs - sendEvent.originServerTs

//   //     yield* endpoints
//   //       .putRoomsSendV3({
//   //         roomId,
//   //         content: {
//   //           msgtype: 'm.text',
//   //           body: `* Pong! 🏓 ${pingMs}ms`,
//   //           'm.newContent': { msgtype: 'm.text', body: `Pong! 🏓 ${pingMs}ms | fullRTT: ${fullRTT}ms` },
//   //           'm.relatesTo': { relType: 'm.replace', eventId: sendEventId },
//   //         },
//   //         eventType: 'm.room.message',
//   //       })
//   //       .pipe(Effect.andThen(api.execute))
//   //   }),
//   //   Effect.catch(err => Effect.logError(`Failed to ping room ${err}`)),
//   // )
// })

// const mxfxLive = MatrixClient.layerMatrixClient.pipe(
//   Layer.provideMerge(MatrixApi.layer),
//   Layer.provideMerge(MatrixAuth.layerLegacyConfig({ accessToken: Config.string('MATRIX_ACCESS_TOKEN') })),
//   Layer.provideMerge(MatrixConfig.layerConfig({ serverName: Config.string('MATRIX_HOME_SERVER') })),
//   Layer.provideMerge(NodeHttpClient.layerNodeHttp),
//   Layer.provideMerge(DevTools.layer()),
//   // Layer.provideMerge(Logger.layer([Logger.consoleStructured])),
// )

// NodeRuntime.runMain(program.pipe(Effect.provide(mxfxLive)))

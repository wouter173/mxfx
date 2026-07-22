import { NodeHttpClient, NodeRuntime } from '@effect/platform-node'
import { Crypto, CryptoNode } from '@mxfx/crypto-node'
import { Effect, Layer, Option, PubSub, Duration, Stream, Cause, Config, Record, References } from 'effect'
import { Filter, Kv, MatrixApi, MatrixAuth, MatrixConfig } from 'mxfx'
import { endpoints } from 'mxfx/api'

const emptyFilter = Filter.make({
  room: {
    timeline: { limit: 10, lazyLoadMembers: true },
    state: { lazyLoadMembers: true },
    accountData: { lazyLoadMembers: true, notTypes: ['*'] },
    ephemeral: { lazyLoadMembers: true, notTypes: ['*'] },
  },
  presence: { notTypes: ['*'] },
  accountData: { notTypes: ['*'] },
})

type SyncFrame = typeof endpoints.getSyncV3ResponseSchema.Type

const syncLoop = Effect.gen(function* () {
  const api = yield* MatrixApi.MatrixApi
  const kv = yield* Kv.Kv
  const crypto = yield* Crypto.Crypto

  const { userId, deviceId } = yield* endpoints.getAccountWhoami().pipe(Effect.andThen(api.execute))

  const machine = yield* crypto.makeMachine({ userId, deviceId: deviceId ?? 'TESTING', storage: { type: 'memory' } })

  const syncHub = yield* PubSub.unbounded<SyncFrame>()
  const syncStream = Stream.fromPubSub(syncHub)

  const syncOnce = kv.getString('syncToken').pipe(
    Effect.flatMap(nextBatch =>
      endpoints
        .getSyncV3({
          useStateAfter: true,
          setPresence: 'online',
          timeout: Duration.seconds(30),
          since: nextBatch.pipe(Option.getOrUndefined),
          fullState: nextBatch.pipe(Option.isNone),
          filter: nextBatch.pipe(Option.match({ onNone: () => emptyFilter, onSome: () => undefined })),
        })
        .pipe(
          Effect.andThen(api.execute),
          Effect.tap(sync => crypto.receiveSyncChanges(machine, sync)),
          Effect.tap(sync => PubSub.publish(syncHub, sync)),
          Effect.tap(sync => kv.set('syncToken', sync.nextBatch)),
          Effect.tap(() => crypto.sendOutgoingRequests(machine)),
        ),
    ),
  )

  yield* Effect.forever(syncOnce).pipe(
    Effect.catchCause(cause => Effect.logError(Cause.pretty(cause))),
    Effect.forkDetach(),
  )

  return { eventStream: syncStream }
})

const handleMessages = Effect.fn(function* (f: SyncFrame) {
  if (!f.rooms?.join) return
  const joinedRooms = f.rooms.join

  const keys = Record.keys(f.rooms?.join)
  yield* Effect.forEach(keys, key =>
    Effect.gen(function* () {
      const room = joinedRooms[key]

      if (!room?.timeline?.events) return
      const events = room.timeline.events

      yield* Effect.forEach(events, event =>
        Effect.gen(function* () {
          if (event.type !== 'm.room.message') return
          yield* Effect.log('new message!', { content: event.content })
        }),
      )
    }),
  )
})

const handleInvites = Effect.fn(function* (f: SyncFrame) {
  const api = yield* MatrixApi.MatrixApi

  if (!f.rooms?.invite) return
  const invitedRooms = f.rooms?.invite

  const keys = Record.keys(invitedRooms)
  yield* Effect.forEach(keys, roomId => endpoints.postRoomsJoinV3({ roomId }).pipe(Effect.andThen(api.execute)))
})

const program = Effect.gen(function* () {
  const { eventStream } = yield* syncLoop

  yield* eventStream.pipe(
    Stream.onFirst(() => Effect.log('Client Started')),
    Stream.runHead,
  )

  yield* Effect.all(
    [
      eventStream.pipe(Stream.runForEach(handleInvites)), //
      eventStream.pipe(Stream.runForEach(handleMessages)),
    ],
    { concurrency: 'unbounded' },
  )
})

const matrixLayer = CryptoNode.layer.pipe(
  Layer.provideMerge(MatrixApi.layer),
  Layer.provideMerge(MatrixAuth.layerAccessToken({ accessToken: Config.string('MATRIX_ACCESS_TOKEN') })),
  Layer.provide(MatrixConfig.layerConfig({ serverName: Config.string('MATRIX_HOME_SERVER') })),
  Layer.provide(NodeHttpClient.layerNodeHttp),
  Layer.provideMerge(Layer.succeed(References.MinimumLogLevel, 'Debug')),
)

NodeRuntime.runMain(program.pipe(Effect.provide(matrixLayer)))

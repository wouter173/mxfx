import { Effect, Layer, Context, Option, PubSub, Duration, Stream } from 'effect'

import { endpoints, MatrixApi } from '../api/index.ts'
import type { RoomId } from '../branded/index.ts'
import { Store } from '../store/index.ts'
import { Reducers } from './sync/reducer.ts'

const make = Effect.gen(function* () {
  const matrixApi = yield* MatrixApi

  const reducers = yield* Reducers
  const store = yield* Store

  const syncHub = yield* PubSub.unbounded<SyncFrame>()
  const syncStream = Stream.fromPubSub(syncHub)

  const syncOnce = store.getNextBatch().pipe(
    Effect.flatMap(nextBatch =>
      endpoints
        .getSyncV3({
          useStateAfter: true,
          timeout: Duration.seconds(30),
          since: nextBatch.pipe(Option.getOrUndefined),
          fullState: nextBatch.pipe(Option.isNone),
          filter: nextBatch.pipe(
            Option.match({
              onNone: () => ({
                room: {
                  timeline: { limit: 0, lazyLoadMembers: true },
                  state: { lazyLoadMembers: true },
                  accountData: { lazyLoadMembers: true, notTypes: ['*'] },
                  ephemeral: { lazyLoadMembers: true, notTypes: ['*'] },
                },
                presence: { notTypes: ['*'] },
                accountData: { notTypes: ['*'] },
              }),
              onSome: () => undefined,
            }),
          ),
        })
        .pipe(
          Effect.andThen(matrixApi.execute),
          Effect.tap(syncResponse => PubSub.publish(syncHub, syncResponse)),
          Effect.tap(syncResponse => Effect.forEach(reducers, reducer => reducer.reduce(syncResponse))),
        ),
    ),
  )
  const syncLoop = () => Effect.forever(syncOnce)

  const onEvent = Effect.fnUntraced(function* <T extends EventLike>(eventUnit: EventUnit<T>, f: (event: T) => Effect.Effect<void, never>) {
    yield* syncStream.pipe(eventUnit.predicate, Stream.runForEach(f), Effect.forkDetach)
  })

  return {
    syncLoop,
    onEvent,
  }
})

type SyncFrame = typeof endpoints.getSyncV3ResponseSchema.Type
type EventLike = { roomId: RoomId; type: string; content: unknown }

type EventUnit<T extends EventLike> = {
  predicate: (frame: Stream.Stream<SyncFrame>) => Stream.Stream<T>
}

export class MatrixClient extends Context.Service<
  MatrixClient,
  {
    syncLoop: () => Effect.Effect<never, unknown> //TODO: Type these errors
    onEvent: <T extends EventLike>(event: EventUnit<T>, f: (event: T) => Effect.Effect<void, never>) => Effect.Effect<void, unknown> //TODO: Type these errors
  }
>()('mxfx/client') {}

export const layerMatrixClient = Layer.effect(MatrixClient, make).pipe(Layer.provideMerge(Reducers.layer))

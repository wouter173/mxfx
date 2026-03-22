import { Effect, Ref } from 'effect'

import { AccountDataRepository } from './repository/global-account-data-repository'
import { RoomRepository } from './repository/room-repository'
import type { SyncResponse } from './types'

export type SyncStoreOptions = {
  readonly maxTimelineEventsPerRoom?: number
}

export type SyncProjectionStore = {
  readonly applySync: (sync: SyncResponse) => Effect.Effect<void>
  readonly getNextBatch: Effect.Effect<string | undefined>
}

const defaultOptions: Required<SyncStoreOptions> = {
  maxTimelineEventsPerRoom: 5_000,
}

const reduceJoinedRooms = (
  rooms: typeof RoomRepository.Service,
  joinRooms: NonNullable<NonNullable<SyncResponse['rooms']>['join']>,
  options: Required<SyncStoreOptions>,
) =>
  Effect.forEach(
    Object.entries(joinRooms),
    ([roomId, roomSync]) => rooms.merge(roomId, roomSync, { maxTimelineEvents: options.maxTimelineEventsPerRoom }),
    { concurrency: 'unbounded' },
  ).pipe(Effect.asVoid)

export const makeSyncProjectionStore = (
  opts?: SyncStoreOptions,
): Effect.Effect<SyncProjectionStore, never, AccountDataRepository | RoomRepository> =>
  Effect.gen(function* () {
    const accountDataRepository = yield* AccountDataRepository
    const roomRepository = yield* RoomRepository

    const options = { ...defaultOptions, ...opts }
    const nextBatchRef = yield* Ref.make<string | undefined>(undefined)

    const applySync: SyncProjectionStore['applySync'] = sync =>
      Effect.gen(function* () {
        yield* accountDataRepository.merge(sync.accountData)

        if (sync.rooms?.join) {
          yield* reduceJoinedRooms(roomRepository, sync.rooms.join, options)
        }

        yield* Ref.set(nextBatchRef, sync.nextBatch)
      })

    return {
      applySync,
      getNextBatch: Ref.get(nextBatchRef),
    } satisfies SyncProjectionStore
  })

import { Effect, Layer, Ref, ServiceMap } from 'effect'

import { getSyncV3ResponseSchema } from '../api/endpoints'
import { GlobalRepository } from './repository/global-repository'
import { RoomRepository } from './repository/room-repository'

type SyncResponse = typeof getSyncV3ResponseSchema.Type

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

export const makeSyncProjectionStore = Effect.fn(function* (opts?: SyncStoreOptions) {
  const globalRepository = yield* GlobalRepository
  const roomRepository = yield* RoomRepository

  const options = { ...defaultOptions, ...opts }
  const nextBatchRef = yield* Ref.make<string | undefined>(undefined)

  const applySync = Effect.fn(function* (sync: SyncResponse) {
    yield* globalRepository.setNextBatchToken(sync.nextBatch)
  })

  return {
    applySync,
    getNextBatch: Ref.get(nextBatchRef),
  }
})

export class MatrixStore extends ServiceMap.Service<MatrixStore, SyncProjectionStore>()('mxfx/store') {}
export const matrixStoreLive = Layer.effect(MatrixStore, makeSyncProjectionStore())

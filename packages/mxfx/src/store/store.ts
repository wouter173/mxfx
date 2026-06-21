import { Context, Effect, Option } from 'effect'

import type { RoomId } from '../branded/index.ts'
import { roomEventWithoutRoomId, stateEventWithoutRoomId } from '../schema/index.ts'
import { makeInMemoryStore } from './in-memory-store.ts'

export type StoreShape = {
  setNextBatch: (nextBatch: string) => Effect.Effect<void>
  getNextBatch: () => Effect.Effect<Option.Option<string>>

  appendTimelineEvents: (events: ReadonlyArray<typeof roomEventWithoutRoomId.Type & { roomId: RoomId }>) => Effect.Effect<void>
  getRoomTimeline: (roomId: RoomId) => Effect.Effect<ReadonlyArray<typeof roomEventWithoutRoomId.Type>>

  applyState: (events: ReadonlyArray<typeof stateEventWithoutRoomId.Type & { roomId: RoomId }>) => Effect.Effect<void>
  getRoomState: (roomId: RoomId) => Effect.Effect<ReadonlyArray<typeof stateEventWithoutRoomId.Type>>
}

export const Store = Context.Reference<StoreShape>('mxfx/store', { defaultValue: makeInMemoryStore })
export type Store = typeof Store

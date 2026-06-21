import { Context, Effect, Option } from 'effect'

import type { RoomId } from '../branded'
import { RoomEventWithoutRoomId, StateEventWithoutRoomId } from '../schema'
import { makeInMemoryStore } from './in-memory-store'

export type StoreShape = {
  setNextBatch: (nextBatch: string) => Effect.Effect<void>
  getNextBatch: () => Effect.Effect<Option.Option<string>>

  appendTimelineEvents: (events: ReadonlyArray<typeof RoomEventWithoutRoomId.Type & { roomId: RoomId }>) => Effect.Effect<void>
  getRoomTimeline: (roomId: RoomId) => Effect.Effect<ReadonlyArray<typeof RoomEventWithoutRoomId.Type>>

  applyState: (events: ReadonlyArray<typeof StateEventWithoutRoomId.Type & { roomId: RoomId }>) => Effect.Effect<void>
  getRoomState: (roomId: RoomId) => Effect.Effect<ReadonlyArray<typeof StateEventWithoutRoomId.Type>>
}

export const Store = Context.Reference<StoreShape>('mxfx/store', { defaultValue: makeInMemoryStore })
export type Store = typeof Store

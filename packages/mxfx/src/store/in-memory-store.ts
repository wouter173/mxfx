import { Effect, Option } from 'effect'

import type { RoomId } from '../branded/index.ts'
import type { roomEventWithoutRoomId, stateEventWithoutRoomId } from '../schema/index.ts'
import type { StoreShape } from './store.ts'

export const makeInMemoryStore = (): StoreShape => {
  const storage: {
    nextBatch: string | undefined
    timelines: Map<RoomId, Array<typeof roomEventWithoutRoomId.Type>>
    state: Map<RoomId, Map<string, typeof stateEventWithoutRoomId.Type>>
  } = { nextBatch: undefined, timelines: new Map(), state: new Map() }

  return {
    setNextBatch: nextBatch =>
      Effect.sync(() => {
        storage.nextBatch = nextBatch
      }).pipe(Effect.andThen(Effect.log('Writing', nextBatch))),

    getNextBatch: () => Effect.sync(() => Option.fromUndefinedOr(storage.nextBatch)).pipe(Effect.tap(x => Effect.log(x))),

    appendTimelineEvents: events =>
      Effect.sync(() => {
        events.forEach(event => {
          const roomTimeline: Array<typeof roomEventWithoutRoomId.Type> = storage.timelines.get(event.roomId) ?? []
          roomTimeline.push(event)
          storage.timelines.set(event.roomId, roomTimeline)
        })
      }),
    getRoomTimeline: (roomId: RoomId) =>
      Effect.sync(() => {
        const roomTimeline: ReadonlyArray<typeof roomEventWithoutRoomId.Type> = [...(storage.timelines.get(roomId) ?? [])]
        return roomTimeline
      }),

    applyState: events =>
      Effect.sync(() => {
        events.forEach(event => {
          const roomState: Map<string, typeof stateEventWithoutRoomId.Type> = storage.state.get(event.roomId) ?? new Map()
          const key = `${event.type}-${event.stateKey}`

          roomState.set(key, event)
          storage.state.set(event.roomId, roomState)
        })
      }),
    getRoomState: (roomId: RoomId) =>
      Effect.sync(() => {
        const roomState: ReadonlyMap<string, typeof stateEventWithoutRoomId.Type> = storage.state.get(roomId) ?? new Map()
        return Array.from(roomState.values())
      }),
  }
}

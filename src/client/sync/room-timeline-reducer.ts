import { Effect } from 'effect'

import { Store } from '../../store'
import type { ReducerShape } from './reducer'

// TODO extract to helpers or somn like it
export const objectEntries = <const O extends Record<PropertyKey, unknown>>(obj: O) =>
  Object.entries(obj) as {
    [K in keyof O]-?: K extends string ? [K, O[K]] : never
  }[keyof O][]

// TODO: this room state reducer only supports
export const roomTimelineReducer: ReducerShape = {
  reduce: sync =>
    Effect.gen(function* () {
      if (!sync.rooms?.join) return Effect.void
      const store = yield* Store

      for (const [roomId, room] of objectEntries(sync.rooms.join)) {
        if (!room.timeline?.events) continue

        yield* store.appendTimelineEvents(room.timeline.events.map(event => ({ ...event, roomId })))
      }
    }),
}

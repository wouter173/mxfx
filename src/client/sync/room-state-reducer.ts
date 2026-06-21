import { Effect } from 'effect'

import { Store } from '../../store'
import type { ReducerShape } from './reducer'

// TODO extract to helpers or somn like it
export const objectEntries = <const O extends Record<PropertyKey, unknown>>(obj: O) =>
  Object.entries(obj) as {
    [K in keyof O]-?: K extends string ? [K, O[K]] : never
  }[keyof O][]

// TODO: this room state reducer only supports useStateAfter and joined rooms
export const roomStateReducer: ReducerShape = {
  reduce: sync =>
    Effect.gen(function* () {
      if (!sync.rooms?.join) return Effect.void
      const store = yield* Store

      for (const [roomId, room] of objectEntries(sync.rooms.join)) {
        if (!room.stateAfter?.events) continue

        yield* store.applyState(room.stateAfter.events.map(event => ({ ...event, roomId })))
      }
    }),
}

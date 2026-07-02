import { Schema } from 'effect'

import { baseEvent, roomEventWithoutRoomId, stateEventWithoutRoomId } from '../../schema/event.ts'

export const AccountData = Schema.Struct({ events: Schema.Array(baseEvent) })

export const StateSchema = Schema.Struct({ events: Schema.Array(stateEventWithoutRoomId) })

export const Timeline = Schema.Struct({
  events: Schema.optional(Schema.Array(roomEventWithoutRoomId)),
  limited: Schema.optional(Schema.Boolean),
  prevBatch: Schema.optional(Schema.String),
})

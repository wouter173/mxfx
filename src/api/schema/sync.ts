import { Schema } from 'effect'

import { BaseEvent, RoomEventWithoutRoomId, StateEventWithoutRoomId } from '../../schema/event'

export const AccountData = Schema.Struct({ events: Schema.Array(BaseEvent) })

export const StateSchema = Schema.Struct({ events: Schema.Array(StateEventWithoutRoomId) })

export const Timeline = Schema.Struct({
  events: Schema.optional(Schema.Array(RoomEventWithoutRoomId)),
  limited: Schema.optional(Schema.Boolean),
  prevBatch: Schema.optional(Schema.String),
})

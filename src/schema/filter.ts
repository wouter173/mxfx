import { Schema } from 'effect'

import { RoomId, UserId } from '../branded'

export const roomEventFilterSchema = Schema.Struct({
  limit: Schema.optional(Schema.Number.check(Schema.isGreaterThanOrEqualTo(0))), // The maximum number of events to return, must be an integer greater than 0. Servers should apply a default value, and impose a maximum value to avoid resource exhaustion.

  containsUrl: Schema.optional(Schema.Boolean), // If true, includes only events with a url key in their content. If false, excludes those events. If omitted, url key is not considered for filtering.
  includeRedundantMembers: Schema.optional(Schema.Boolean), //  If true, sends all membership events for all events, even if they have already been sent to the client. Does not apply unless lazy_load_members is true. See Lazy-loading room members for more information. Defaults to false.
  lazyLoadMembers: Schema.optional(Schema.Boolean), // If true, enables lazy-loading of membership events. See Lazy-loading room members for more information. Defaults to false.
  unreadThreadNotifications: Schema.optional(Schema.Boolean), //  If true, enables per-thread notification counts. Only applies to the /sync endpoint. Defaults to false.

  notRooms: Schema.optional(Schema.Array(RoomId.schema)), // A list of room IDs to exclude. If this list is absent then no rooms are excluded. A matching room will be excluded even if it is listed in the rooms filter.
  notSenders: Schema.optional(Schema.Array(UserId.schema)), // A list of sender IDs to exclude. If this list is absent then no senders are excluded. A matching sender will be excluded even if it is listed in the senders filter.
  notTypes: Schema.optional(Schema.Array(Schema.String)), // A list of event types to exclude. If this list is absent then no event types are excluded. A matching type will be excluded even if it is listed in the types filter. A * can be used as a wildcard to match any sequence of characters.

  rooms: Schema.optional(Schema.Array(RoomId.schema)), // A list of room IDs to include. If this list is absent then all rooms are included.
  senders: Schema.optional(Schema.Array(UserId.schema)), // A list of senders IDs to include. If this list is absent then all senders are included.
  types: Schema.optional(Schema.Array(Schema.String)), // A list of event types to include. If this list is absent then all event types are included. A * can be used as a wildcard to match any sequence of characters.
})
export type RoomEventFilter = typeof roomEventFilterSchema.Type

export const roomFilterSchema = Schema.Struct({
  includeLeave: Schema.optional(Schema.Boolean), // Include rooms that the user has left in the sync. Defaults to false.

  notRooms: Schema.optional(Schema.Array(RoomId.schema)), // A list of room IDs to exclude. If this list is absent then no rooms are excluded. A matching room will be excluded even if it is listed in the rooms filter. This filter is applied before the filters in ephemeral, state, timeline or account_data
  rooms: Schema.optional(Schema.Array(RoomId.schema)), // A list of room IDs to include. If this list is absent then all rooms are included. This filter is applied before the filters in ephemeral, state, timeline or account_data

  state: Schema.optional(roomEventFilterSchema), // The state events to include for rooms.
  timeline: Schema.optional(roomEventFilterSchema), // The message and state update events to include for rooms.
  accountData: Schema.optional(roomEventFilterSchema), // The per user account data to include for rooms.
  ephemeral: Schema.optional(roomEventFilterSchema), // The ephemeral events to include for rooms. These are the events that appear in the ephemeral property in the /sync response.
})
export type RoomFilter = typeof roomFilterSchema.Type

export const eventFilterSchema = Schema.Struct({
  limit: Schema.optional(Schema.Number.check(Schema.isGreaterThan(0))), // The maximum number of events to return, must be an integer greater than 0. Servers should apply a default value, and impose a maximum value to avoid resource exhaustion.

  notSenders: Schema.optional(Schema.Array(UserId.schema)), // A list of sender IDs to exclude. If this list is absent then no senders are excluded. A matching sender will be excluded even if it is listed in the senders filter.
  notTypes: Schema.optional(Schema.Array(Schema.String)), // A list of event types to exclude. If this list is absent then no event types are excluded. A matching type will be excluded even if it is listed in the types filter.

  senders: Schema.optional(Schema.Array(UserId.schema)), // A list of senders IDs to include. If this list is absent then all senders are included.
  types: Schema.optional(Schema.Array(Schema.String)), // A list of event types to include. If this list is absent then all event types are included. A * can be used as a wildcard to match any sequence of characters.
})
export type EventFilter = typeof eventFilterSchema.Type

export const filterSchema = Schema.Struct({
  accountData: Schema.optional(eventFilterSchema), //The user account data that isn’t associated with rooms to include.
  eventFields: Schema.optional(Schema.Array(Schema.String)), // List of event fields to include. If this list is absent then all fields are included. The entries are dot-separated paths for each property to include. So ['content.body'] will include the body field of the content object. A server may include more fields than were requested.
  eventFormat: Schema.optional(Schema.Literals(['client', 'federation'])), // The format to use for events. client will return the events in a format suitable for clients. federation will return the raw event as received over federation. The default is client. One of: [client, federation].
  presence: Schema.optional(eventFilterSchema), // The presence updates to include.
  room: Schema.optional(roomFilterSchema), // Filters to be applied to room data.
})
export type Filter = typeof filterSchema.Type

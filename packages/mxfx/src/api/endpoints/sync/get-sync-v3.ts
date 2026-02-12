import { Effect, Schema } from 'effect'
import { makeEndpoint } from '../../matrix-endpoint'
import { AccountDataSchema, BaseEventSchema, StateSchema, StrippedStateEventSchema, TimelineSchema } from '../../schema/common'

import { HttpBody } from '@effect/platform'
import { RoomId } from '../../../branded/room-id'
import { EventId } from '../../../branded/event-id'

const presenceSchema = Schema.Union(Schema.Literal('online'), Schema.Literal('offline'), Schema.Literal('unavailable'))

const optionsSchema = Schema.Struct({
  filter: Schema.optional(Schema.String),
  fullState: Schema.optional(Schema.Boolean).pipe(Schema.fromKey('full_state')),
  setPresence: Schema.optional(presenceSchema).pipe(Schema.fromKey('set_presence')),
  since: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.DurationFromMillis),
  useStateAfter: Schema.optional(Schema.Boolean).pipe(Schema.fromKey('use_state_after')),
})

const responseSchema = Schema.Struct({
  accountData: Schema.optional(AccountDataSchema).pipe(Schema.fromKey('account_data')),
  deviceLists: Schema.optional(Schema.Any).pipe(Schema.fromKey('device_lists')), //TODO
  deviceOneTimeKeysCount: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Number })).pipe(
    Schema.fromKey('device_one_time_keys_count'),
  ),
  nextBatch: Schema.propertySignature(Schema.String).pipe(Schema.fromKey('next_batch')),
  presence: Schema.optional(
    Schema.Struct({
      events: Schema.Array(BaseEventSchema),
    }),
  ),
  rooms: Schema.optional(
    Schema.Struct({
      invite: Schema.optional(
        Schema.Record({
          key: RoomId.schema,
          value: Schema.Struct({
            inviteState: Schema.optional(Schema.Struct({ events: Schema.Array(StrippedStateEventSchema) })).pipe(
              Schema.fromKey('invite_state'),
            ),
          }),
        }),
      ),
      join: Schema.optional(
        Schema.Record({
          key: RoomId.schema,
          value: Schema.Struct({
            accountData: Schema.optional(AccountDataSchema).pipe(Schema.fromKey('account_data')),
            ephemeral: Schema.optional(Schema.Struct({ events: Schema.Array(BaseEventSchema) })), //TODO
            state: Schema.optional(StateSchema),
            summary: Schema.optional(
              Schema.Struct({
                mHeroes: Schema.optional(Schema.Array(Schema.String)).pipe(Schema.fromKey('m.heroes')),
                mInvitedMemberCount: Schema.optional(Schema.Number.pipe(Schema.int())).pipe(Schema.fromKey('m.invited_member_count')),
                mJoinedMemberCount: Schema.optional(Schema.Number.pipe(Schema.int())).pipe(Schema.fromKey('m.joined_member_count')),
              }),
            ),
            timeline: Schema.optional(TimelineSchema),
            unreadNotifications: Schema.optional(
              Schema.Struct({
                highlightCount: Schema.propertySignature(Schema.Number.pipe(Schema.int())).pipe(Schema.fromKey('highlight_count')),
                notificationCount: Schema.propertySignature(Schema.Number.pipe(Schema.int())).pipe(Schema.fromKey('notification_count')),
              }),
            ).pipe(Schema.fromKey('unread_notifications')),
            unreadThreadNotifications: Schema.optional(
              Schema.Record({
                key: EventId.schema,
                value: Schema.Struct({
                  highlightCount: Schema.optional(Schema.Number.pipe(Schema.int())).pipe(Schema.fromKey('highlight_count')),
                  notificationCount: Schema.optional(Schema.Number.pipe(Schema.int())).pipe(Schema.fromKey('notification_count')),
                }),
              }),
            ).pipe(Schema.fromKey('unread_thread_notifications')),
          }),
        }),
      ),
      knock: Schema.optional(
        Schema.Record({
          key: RoomId.schema,
          value: Schema.Struct({
            knockState: Schema.optional(Schema.Struct({ events: Schema.Array(StrippedStateEventSchema) })).pipe(
              Schema.fromKey('knock_state'),
            ),
          }),
        }),
      ),
      leave: Schema.optional(
        Schema.Record({
          key: RoomId.schema,
          value: Schema.Struct({
            accountData: Schema.optional(AccountDataSchema).pipe(Schema.fromKey('account_data')),
            state: Schema.optional(StateSchema),
            timeline: Schema.optional(TimelineSchema),
          }),
        }),
      ), //TODO
    }),
  ),
  toDevice: Schema.optional(
    Schema.Struct({
      events: Schema.Array(BaseEventSchema),
    }),
  ).pipe(Schema.fromKey('to_device')),
})

/**
 * `GET /_matrix/client/v3/sync`
 *
 * Synchronise the client’s state with the latest state on the server. Clients use this API when they first log in to get an initial
 * snapshot of the state on the server, and then continue to call this API to get incremental deltas to the state, and to receive new
 * messages.
 *
 * @category Endpoints
 * @see https://spec.matrix.org/v1.17/client-server-api/#get_matrixclientv3sync
 */
export const getSyncV3 = (options: typeof optionsSchema.Type) =>
  makeEndpoint({
    path: '/v3/sync',
    method: 'GET',
    auth: true,
    body: Schema.encode(optionsSchema)(options).pipe(Effect.andThen(HttpBody.json)),
    schema: responseSchema,
  })

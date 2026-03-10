import { Effect, Schema } from 'effect'

import { EventId } from '../../../branded/event-id'
import { RoomId } from '../../../branded/room-id'
import { AccountData, BaseEvent, StateSchema, StrippedStateEvent, Timeline } from '../../schema/common'
import { apiPath, makeEndpoint } from '../helpers'

const presenceSchema = Schema.Union([Schema.Literal('online'), Schema.Literal('offline'), Schema.Literal('unavailable')])

const optionsSchema = Schema.Struct({
  filter: Schema.optional(Schema.String),
  fullState: Schema.optional(Schema.Boolean),
  setPresence: Schema.optional(presenceSchema),
  since: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.DurationFromMillis),
  useStateAfter: Schema.optional(Schema.Boolean),
})

export const getSyncV3ResponseSchema = Schema.Struct({
  accountData: Schema.optional(AccountData),
  deviceLists: Schema.optional(Schema.Any), //TODO
  deviceOneTimeKeysCount: Schema.optional(Schema.Record(Schema.String, Schema.Number)),
  nextBatch: Schema.String,
  presence: Schema.optional(Schema.Struct({ events: Schema.Array(BaseEvent) })),
  rooms: Schema.optional(
    Schema.Struct({
      invite: Schema.optional(
        Schema.Record(
          RoomId.schema,
          Schema.Struct({
            inviteState: Schema.optional(Schema.Struct({ events: Schema.Array(StrippedStateEvent) })),
          }),
        ),
      ),
      join: Schema.optional(
        Schema.Record(
          RoomId.schema,
          Schema.Struct({
            accountData: Schema.optional(AccountData),
            ephemeral: Schema.optional(Schema.Struct({ events: Schema.Array(BaseEvent) })), //TODO
            state: Schema.optional(StateSchema),
            summary: Schema.optional(
              Schema.Struct({
                'm.heroes': Schema.optional(Schema.Array(Schema.String)),
                'm.invitedMemberCount': Schema.optional(Schema.Int),
                'm.joinedMemberCount': Schema.optional(Schema.Int),
              }),
            ),
            timeline: Schema.optional(Timeline),
            unreadNotifications: Schema.optional(
              Schema.Struct({
                highlightCount: Schema.Int,
                notificationCount: Schema.Int,
              }),
            ),
            unreadThreadNotifications: Schema.optional(
              Schema.Record(
                EventId.schema,
                Schema.Struct({
                  highlightCount: Schema.optional(Schema.Int),
                  notificationCount: Schema.optional(Schema.Int),
                }),
              ),
            ),
          }),
        ),
      ),
      knock: Schema.optional(
        Schema.Record(
          RoomId.schema,
          Schema.Struct({
            knockState: Schema.optional(Schema.Struct({ events: Schema.Array(StrippedStateEvent) })),
          }),
        ),
      ),
      leave: Schema.optional(
        Schema.Record(
          RoomId.schema,
          Schema.Struct({
            accountData: Schema.optional(AccountData),
            state: Schema.optional(StateSchema),
            timeline: Schema.optional(Timeline),
          }),
        ),
      ), //TODO
    }),
  ),
  toDevice: Schema.optional(Schema.Struct({ events: Schema.Array(BaseEvent) })),
})

/**
 * `GET /_matrix/client/v3/sync`
 *
 * @description
 * Synchronise the client’s state with the latest state on the server. Clients use this API when they first log in to get an initial
 * snapshot of the state on the server, and then continue to call this API to get incremental deltas to the state, and to receive new
 * messages.
 *
 * @see https://spec.matrix.org/v1.17/client-server-api/#get_matrixclientv3sync
 */
export const getSyncV3 = (options: typeof optionsSchema.Type) =>
  Effect.gen(function* () {
    const params = yield* Schema.encodeEffect(optionsSchema)(options)

    return yield* makeEndpoint({
      path: apiPath()`/v3/sync`,
      method: 'GET',
      auth: true,
      params,
      schema: getSyncV3ResponseSchema,
    })
  })

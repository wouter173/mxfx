import { Effect, Schema } from 'effect'

import { EventId, RoomId } from '../../../branded/index.ts'
import { baseEvent, strippedStateEvent, filterSchema } from '../../../schema/index.ts'
import { encodeSnakeCaseSchema } from '../../schema/encode-case.ts'
import { AccountData, StateSchema, Timeline } from '../../schema/sync.ts'
import { makeEndpoint } from '../endpoint.ts'

const presenceSchema = Schema.Union([Schema.Literal('online'), Schema.Literal('offline'), Schema.Literal('unavailable')])

const optionsSchema = Schema.Struct({
  filter: Schema.optional(Schema.fromJsonString(encodeSnakeCaseSchema(filterSchema))), //TODO: remove snakecase handling here
  fullState: Schema.optional(Schema.Boolean),
  setPresence: Schema.optional(presenceSchema),
  since: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.DurationFromMillis),
  useStateAfter: Schema.optional(Schema.Boolean),
})

//TODO: don't export this from here, it's noy only used in this endpoint
export const getSyncV3ResponseSchema = Schema.Struct({
  accountData: Schema.optional(AccountData),
  deviceLists: Schema.optional(Schema.Any), //TODO
  deviceOneTimeKeysCount: Schema.optional(Schema.Record(Schema.String, Schema.Number)),
  nextBatch: Schema.String,
  presence: Schema.optional(Schema.Struct({ events: Schema.Array(baseEvent) })),
  rooms: Schema.optional(
    Schema.Struct({
      invite: Schema.optional(
        Schema.Record(
          RoomId.schema,
          Schema.Struct({
            inviteState: Schema.optional(Schema.Struct({ events: Schema.Array(strippedStateEvent) })),
          }),
        ),
      ),
      join: Schema.optional(
        Schema.Record(
          RoomId.schema,
          Schema.Struct({
            accountData: Schema.optional(AccountData),
            ephemeral: Schema.optional(Schema.Struct({ events: Schema.Array(baseEvent) })), //TODO
            state: Schema.optional(StateSchema),
            stateAfter: Schema.optional(StateSchema),
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
            knockState: Schema.optional(Schema.Struct({ events: Schema.Array(strippedStateEvent) })),
          }),
        ),
      ),
      leave: Schema.optional(
        Schema.Record(
          RoomId.schema,
          Schema.Struct({
            accountData: Schema.optional(AccountData),
            state: Schema.optional(StateSchema),
            stateAfter: Schema.optional(StateSchema),
            timeline: Schema.optional(Timeline),
          }),
        ),
      ), //TODO
    }),
  ),
  toDevice: Schema.optional(Schema.Struct({ events: Schema.Array(baseEvent) })),
})

const schema = getSyncV3ResponseSchema

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
    const params = yield* Schema.encodeEffect(encodeSnakeCaseSchema(optionsSchema))(options) //TODO: remove snakecase handling here

    return yield* makeEndpoint('GET', { auth: true, params, schema })`/v3/sync`
  })

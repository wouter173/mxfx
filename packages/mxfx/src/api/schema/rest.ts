import { Schema } from 'effect'
import { EventIdSchema, MxcUriSchema, RoomIdSchema, UserIdSchema } from '../../branded'
import { BaseEventSchema, ClientEventSchema, ClientEventWithoutRoomIdSchema, StrippedStateEventSchema } from './common'

export const AccountDataSchema = Schema.Struct({
  events: Schema.Array(BaseEventSchema),
})

export const TimelineSchema = Schema.Struct({
  events: Schema.optional(Schema.Array(ClientEventWithoutRoomIdSchema)),
  limited: Schema.optional(Schema.Boolean),
  prev_batch: Schema.optional(Schema.String),
})

export const StateSchema = Schema.Struct({ events: Schema.Array(ClientEventWithoutRoomIdSchema) })

export const SyncV3ResponseSchema = Schema.Struct({
  account_data: Schema.optional(AccountDataSchema),
  device_lists: Schema.optional(Schema.Any), //TODO
  device_one_time_keys_count: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Number })),
  next_batch: Schema.String,
  presence: Schema.optional(
    Schema.Struct({
      events: Schema.Array(BaseEventSchema),
    }),
  ),
  rooms: Schema.optional(
    Schema.Struct({
      invite: Schema.optional(
        Schema.Record({
          key: RoomIdSchema,
          value: Schema.Struct({ invite_state: Schema.optional(Schema.Struct({ events: Schema.Array(StrippedStateEventSchema) })) }),
        }),
      ),
      join: Schema.optional(
        Schema.Record({
          key: RoomIdSchema,
          value: Schema.Struct({
            account_data: Schema.optional(AccountDataSchema),
            ephemeral: Schema.optional(Schema.Struct({ events: Schema.Array(BaseEventSchema) })), //TODO
            state: Schema.optional(StateSchema),
            summary: Schema.optional(
              Schema.Struct({
                'm.heroes': Schema.optional(Schema.Array(Schema.String)),
                'm.invited_member_count': Schema.optional(Schema.Number.pipe(Schema.int())),
                'm.joined_member_count': Schema.optional(Schema.Number.pipe(Schema.int())),
              }),
            ),
            timeline: Schema.optional(TimelineSchema),
            unread_notifications: Schema.optional(
              Schema.Struct({
                highlight_count: Schema.Number.pipe(Schema.int()),
                notification_count: Schema.Number.pipe(Schema.int()),
              }),
            ),
            unread_thread_notifications: Schema.optional(
              Schema.Record({
                key: EventIdSchema,
                value: Schema.Struct({
                  highlight_count: Schema.optional(Schema.Number.pipe(Schema.int())),
                  notification_count: Schema.optional(Schema.Number.pipe(Schema.int())),
                }),
              }),
            ),
          }),
        }),
      ),
      knock: Schema.optional(
        Schema.Record({
          key: RoomIdSchema,
          value: Schema.Struct({
            knock_state: Schema.optional(Schema.Struct({ events: Schema.Array(StrippedStateEventSchema) })),
          }),
        }),
      ),
      leave: Schema.optional(
        Schema.Record({
          key: RoomIdSchema,
          value: Schema.Struct({
            account_data: Schema.optional(AccountDataSchema),
            state: Schema.optional(StateSchema),
            timeline: Schema.optional(TimelineSchema),
          }),
        }),
      ), //TODO
    }),
  ),
  to_device: Schema.optional(
    Schema.Struct({
      events: Schema.Array(BaseEventSchema),
    }),
  ),
})

export const RoomMessageV3ResponseSchema = Schema.Struct({
  chunk: Schema.Array(ClientEventSchema),
  start: Schema.String,
  end: Schema.optional(Schema.String),
  state: Schema.optional(Schema.Array(ClientEventSchema)),
})

export const DiscoveryInformationResponseSchema = Schema.Struct({
  'm.homeserver': Schema.Struct({ base_url: Schema.String }),
})

export const VersionsResponseSchema = Schema.Struct({
  versions: Schema.Array(Schema.String),
})

export const RefreshV3ResponseSchema = Schema.Struct({
  access_token: Schema.String,
  expires_in_ms: Schema.Number.pipe(Schema.int()),
  refresh_token: Schema.String,
})

export const ProfileV3ResponseSchema = Schema.Struct({
  avatar_url: Schema.optional(MxcUriSchema),
  displayname: Schema.optional(Schema.String),
})

export const AccountWhoamiV3ResponseSchema = Schema.Struct({
  user_id: UserIdSchema,
  device_id: Schema.optional(Schema.String),
  is_guest: Schema.optional(Schema.Boolean),
})

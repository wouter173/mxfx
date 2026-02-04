import { Schema } from 'effect'
import { MxcUriSchema, UserIdSchema } from '../../branded'

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

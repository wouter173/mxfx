import { Schema } from 'effect'
import { MxcUri } from '../../branded/mxc-uri'
import { UserId } from '../../branded/user-id'

export const DiscoveryInformationResponseSchema = Schema.Struct({
  'm.homeserver': Schema.Struct({ base_url: Schema.String }),
})

export const VersionsResponseSchema = Schema.Struct({
  versions: Schema.Array(Schema.String),
})

export const RefreshV3ResponseSchema = Schema.Struct({
  accessToken: Schema.String,
  expiresInMs: Schema.Int,
  refreshToken: Schema.String,
})

export const ProfileV3ResponseSchema = Schema.Struct({
  avatarUrl: Schema.optional(MxcUri.schema),
  displayname: Schema.optional(Schema.String),
})

export const AccountWhoamiV3ResponseSchema = Schema.Struct({
  userId: UserId.schema,
  deviceId: Schema.optional(Schema.String),
  isGuest: Schema.optional(Schema.Boolean),
})

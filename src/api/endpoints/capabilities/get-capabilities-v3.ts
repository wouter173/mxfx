import { Schema } from 'effect'

import { makeEndpoint } from '../endpoint'

const booleanCapabilitySchema = Schema.Struct({
  enabled: Schema.Boolean,
})

const profileFieldsCapabilitySchema = Schema.Struct({
  allowed: Schema.optional(Schema.Array(Schema.String)),
  disallowed: Schema.optional(Schema.Array(Schema.String)),
  enabled: Schema.Boolean,
})

const roomVersionsCapability = Schema.Struct({
  default: Schema.String,
  available: Schema.Record(Schema.String, Schema.String),
})

const schema = Schema.Struct({
  capabilities: Schema.Struct({
    'm.3pid_changes': booleanCapabilitySchema,
    'm.change_password': booleanCapabilitySchema,
    'm.get_login_token': booleanCapabilitySchema,
    'm.profile_fields': profileFieldsCapabilitySchema,
    'm.room_versions': roomVersionsCapability,
    /** @deprecated */
    'm.set_avatar_url': booleanCapabilitySchema,
    /** @deprecated */
    'm.set_displayname': booleanCapabilitySchema,
    // Other capabilities may be present
  }),
})

/**
 * `GET /_matrix/client/v3/capabilities`
 *
 * Gets information about the server’s supported feature set and other relevant capabilities.
 *
 * @see https://spec.matrix.org/v1.17/client-server-api/#get_matrixclientv3capabilities
 */
export const getCapabilitiesV3 = () => makeEndpoint('GET', { auth: true, schema })`/v3/capabilities`

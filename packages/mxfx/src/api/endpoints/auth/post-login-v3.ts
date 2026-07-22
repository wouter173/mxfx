import { Schema } from 'effect'

import { makeEndpoint } from '../endpoint.ts'
import * as RequestOptions from '../request-options.ts'

const commonOptionsSchema = Schema.Struct({
  initialDeviceDisplayName: Schema.optional(Schema.String),
  refreshToken: Schema.optional(Schema.Boolean),
})

const optionsSchema = Schema.Union([
  Schema.Struct({
    ...commonOptionsSchema.fields,
    type: Schema.Literal('m.login.token'),
    token: Schema.String,
  }),
  Schema.Struct({
    ...commonOptionsSchema.fields,
    type: Schema.Literal('m.login.password'),
    password: Schema.String,
    identifier: Schema.Union([
      Schema.Struct({ type: Schema.Literal('m.id.user'), user: Schema.String }),
      Schema.Record(Schema.String, Schema.Unknown),
    ]),
  }),
])

const DiscoveryInformationResponseSchema = Schema.Struct({
  'm.homeserver': Schema.Struct({ base_url: Schema.String }),
})

const schema = Schema.Struct({
  accessToken: Schema.String,
  deviceId: Schema.String,
  userId: Schema.String,
  expiresInMs: Schema.optional(Schema.Int),
  refreshToken: Schema.optional(Schema.String),
  wellKnown: Schema.optional(DiscoveryInformationResponseSchema),
})

/**
 * `GET /_matrix/client/v3/login`
 *
 * Authenticates the user, and issues an access token they can use to authorize themself in subsequent requests.
 *
 * @see https://spec.matrix.org/v1.17/client-server-api/#post_matrixclientv3login
 */
export const postLoginV3 = (options: Schema.Schema.Type<typeof optionsSchema>) =>
  makeEndpoint('POST', { auth: false, body: RequestOptions.body(optionsSchema, options), schema })`/v3/login`

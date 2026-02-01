import { HttpBody } from '@effect/platform'
import { Effect, Schema } from 'effect'
import { makeEndpoint } from '../matrix-endpoint'
import { DiscoveryInformationResponseSchema } from '../schema/rest'

const commonOptionsSchema = Schema.Struct({
  initialDeviceDisplayName: Schema.optional(Schema.String).pipe(Schema.fromKey('initial_device_display_name')),
  refreshToken: Schema.optional(Schema.Boolean).pipe(Schema.fromKey('refresh_token')),
})

const optionsSchema = Schema.Union(
  Schema.Struct({
    type: Schema.Literal('m.login.token'),
    token: Schema.String,
  }).pipe(Schema.extend(commonOptionsSchema)),
  Schema.Struct({
    type: Schema.Literal('m.login.password'),
    password: Schema.String,
    identifier: Schema.Union(
      Schema.Struct({ type: Schema.Literal('m.id.user'), user: Schema.String }),
      Schema.Record({ key: Schema.String, value: Schema.Unknown }),
    ),
  }).pipe(Schema.extend(commonOptionsSchema)),
)

const responseSchema = Schema.Struct({
  accessToken: Schema.propertySignature(Schema.String).pipe(Schema.fromKey('access_token')),
  deviceId: Schema.propertySignature(Schema.String).pipe(Schema.fromKey('device_id')),
  userId: Schema.propertySignature(Schema.String).pipe(Schema.fromKey('user_id')),
  expiresInMs: Schema.optional(Schema.Number.pipe(Schema.int())).pipe(Schema.fromKey('expires_in_ms')),
  refreshToken: Schema.optional(Schema.String).pipe(Schema.fromKey('refresh_token')),
  wellKnown: Schema.optional(DiscoveryInformationResponseSchema).pipe(Schema.fromKey('well_known')),
})

/**
 * `GET /_matrix/client/v3/login`
 *
 * Authenticates the user, and issues an access token they can use to authorize themself in subsequent requests.
 *
 * @category Endpoints
 * @see https://spec.matrix.org/v1.17/client-server-api/#post_matrixclientv3login
 */
export const postLoginV3 = (options: Schema.Schema.Type<typeof optionsSchema>) =>
  makeEndpoint({
    auth: false,
    method: 'POST',
    path: '/v3/login',
    body: Schema.encode(optionsSchema)(options).pipe(Effect.andThen(HttpBody.json)),
    schema: responseSchema,
  })

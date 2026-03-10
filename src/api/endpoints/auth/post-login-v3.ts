import { Effect, Schema } from 'effect'
import { HttpBody } from 'effect/unstable/http'

import { encodeSnakeCaseSchema } from '../../schema/encode-case'
import { DiscoveryInformationResponseSchema } from '../../schema/rest'
import { apiPath, makeEndpoint } from '../helpers'

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

const responseSchema = Schema.Struct({
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
  Effect.gen(function* () {
    //TODO: this is weird encodeSnakeCaseSchema should not be exposed like this
    const body = yield* Schema.encodeEffect(optionsSchema.pipe(encodeSnakeCaseSchema))(options).pipe(Effect.andThen(HttpBody.json))
    return yield* makeEndpoint({
      auth: false,
      method: 'POST',
      path: apiPath()`/v3/login`,
      body,
      schema: responseSchema,
    })
  })

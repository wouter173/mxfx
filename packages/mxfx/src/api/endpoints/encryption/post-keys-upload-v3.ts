import { Effect, Schema } from 'effect'
import { HttpBody } from 'effect/unstable/http'

import { UserId } from '../../../branded/user-id.ts'
import { encodeSnakeCaseSchema } from '../../schema/encode-case.ts'
import { makeEndpoint } from '../endpoint.ts'

const deviceKeysSchema = Schema.Struct({
  userId: UserId.schema,
  deviceId: Schema.String,
  algorithms: Schema.Array(Schema.String),
  keys: Schema.Record(Schema.String, Schema.String),
  signatures: Schema.Record(UserId.schema, Schema.Record(Schema.String, Schema.String)),
})

const keyObjectSchema = Schema.Struct({
  key: Schema.String,
  signatures: Schema.Record(UserId.schema, Schema.Unknown),
})

const optionsSchema = Schema.Union([
  Schema.Struct({
    deviceKeys: Schema.optional(deviceKeysSchema),
    fallbackKeys: Schema.optional(
      Schema.Record(Schema.String, Schema.Union([Schema.String, keyObjectSchema.pipe(Schema.fieldsAssign({ fallback: Schema.Boolean }))])),
    ),
    oneTimeKeys: Schema.optional(Schema.Record(Schema.String, Schema.Union([Schema.String, keyObjectSchema]))),
  }),
  Schema.String,
])

const schema = Schema.Struct({
  oneTimeKeyCounts: Schema.Record(Schema.String, Schema.Number),
})

/**
 * `POST /_matrix/client/v3/keys/upload`
 *
 * @description
 * Publishes end-to-end encryption keys for the device.
 *
 * @see https://spec.matrix.org/latest/client-server-api/#post_matrixclientv3keysupload
 */
export const postKeysUploadV3 = Effect.fn(function* (options: typeof optionsSchema.Type) {
  const body = yield* optionsSchema.makeEffect(options).pipe(
    Effect.andThen(Schema.encodeUnknownEffect(optionsSchema.pipe(encodeSnakeCaseSchema))),
    Effect.andThen(body => (typeof body === 'string' ? Effect.succeed(HttpBody.text(body, 'application/json')) : HttpBody.json(body))),
  )

  return yield* makeEndpoint('POST', { auth: true, schema, body })`/v3/keys/upload`
})

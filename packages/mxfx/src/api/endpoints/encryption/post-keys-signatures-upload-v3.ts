import { Effect, Schema } from 'effect'
import { HttpBody } from 'effect/unstable/http'

import { UserId } from '../../../branded/user-id.ts'
import { encodeSnakeCaseSchema } from '../../schema/encode-case.ts'
import { BaseErrorSchema } from '../../schema/error.ts'
import { makeEndpoint } from '../endpoint.ts'

const signaturesSchema = Schema.Record(UserId.schema, Schema.Record(Schema.String, Schema.String))

const deviceKeysSchema = Schema.Struct({
  userId: UserId.schema,
  deviceId: Schema.String,
  algorithms: Schema.Array(Schema.String),
  keys: Schema.Record(Schema.String, Schema.String),
  signatures: signaturesSchema,
})

const crossSigningKeySchema = Schema.Struct({
  userId: UserId.schema,
  usage: Schema.Array(Schema.String),
  keys: Schema.Record(Schema.String, Schema.String),
  signatures: signaturesSchema,
})

const optionsSchema = Schema.Union([
  Schema.Record(UserId.schema, Schema.Record(Schema.String, Schema.Union([deviceKeysSchema, crossSigningKeySchema, Schema.Unknown]))),
  Schema.String,
])

const schema = Schema.Struct({
  failures: Schema.optional(Schema.Record(UserId.schema, Schema.Record(Schema.String, BaseErrorSchema))),
})

/**
 * `POST /_matrix/client/v3/keys/signatures/upload`
 *
 * @description
 * Publishes cross-signing signatures for the user.
 *
 * The signed JSON object must match the key previously uploaded or retrieved for the given key ID, with the exception of the signatures property, which contains the new signature(s) to add.
 *
 * @see https://spec.matrix.org/unstable/client-server-api/#post_matrixclientv3keyssignaturesupload
 */
export const postKeysSignaturesUploadV3 = Effect.fn(function* (options: typeof optionsSchema.Type) {
  const body = yield* optionsSchema.makeEffect(options).pipe(
    Effect.andThen(Schema.encodeUnknownEffect(optionsSchema.pipe(encodeSnakeCaseSchema))),
    Effect.andThen(body => (typeof body === 'string' ? Effect.succeed(HttpBody.text(body, 'application/json')) : HttpBody.json(body))),
  )

  return yield* makeEndpoint('POST', { auth: true, schema, body })`/v3/keys/signatures/upload`
})

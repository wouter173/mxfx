import { Effect, Schema } from 'effect'
import { HttpBody } from 'effect/unstable/http'

import { UserId } from '../../../branded/user-id.ts'
import { encodeSnakeCaseSchema } from '../../schema/encode-case.ts'
import { makeEndpoint } from '../endpoint.ts'

const optionsSchema = Schema.Struct({
  oneTimeKeys: Schema.Record(UserId.schema, Schema.Record(Schema.String, Schema.String)),
  timeout: Schema.Number.check(Schema.isGreaterThanOrEqualTo(0)).pipe(Schema.withDecodingDefaultType(Effect.succeed(10_000))),
})

const keyObjectSchema = Schema.Struct({
  key: Schema.String,
  signatures: Schema.Record(UserId.schema, Schema.Unknown),
})

const schema = Schema.Struct({
  oneTimeKeys: Schema.Record(
    UserId.schema,
    Schema.Record(Schema.String, Schema.Record(Schema.String, Schema.Union([Schema.String, keyObjectSchema]))),
  ),
  failures: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
})

/**
 * `POST /_matrix/client/v3/keys/claim`
 *
 * @description
 * Claims one-time keys for use in pre-key messages.
 *
 * The request contains the user ID, device ID and algorithm name of the keys that are required. If a key matching these requirements can
 * be found, the response contains it. The returned key is a one-time key if one is available, and otherwise a fallback key.
 *
 * One-time keys are given out in the order that they were uploaded via /keys/upload. (All keys uploaded within a given call to
 * /keys/upload are considered equivalent in this regard; no ordering is specified within them.)
 *
 * Servers must ensure that each one-time key is returned at most once, so when a key has been returned, no other request will ever return
 * the same key.
 *
 * @see https://spec.matrix.org/latest/client-server-api/#post_matrixclientv3keysclaim
 */
export const postKeysClaimV3 = Effect.fn(function* (options: typeof optionsSchema.Type) {
  const body = yield* Schema.encodeEffect(optionsSchema.pipe(encodeSnakeCaseSchema))(options).pipe(
    Effect.andThen(body => HttpBody.json(body)),
  )

  return yield* makeEndpoint('POST', { auth: true, schema, body })`/v3/keys/claim`
})

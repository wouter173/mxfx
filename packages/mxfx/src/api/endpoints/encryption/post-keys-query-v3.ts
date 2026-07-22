import { Effect, Schema } from 'effect'
import { HttpBody } from 'effect/unstable/http'

import { UserId } from '../../../branded/user-id.ts'
import { encodeSnakeCaseSchema } from '../../schema/encode-case.ts'
import { makeEndpoint } from '../endpoint.ts'

const optionsSchema = Schema.Struct({
  deviceKeys: Schema.Record(UserId.schema, Schema.Array(Schema.String)),
  timeout: Schema.Number.check(Schema.isGreaterThanOrEqualTo(0)).pipe(Schema.withConstructorDefault(Effect.succeed(10_000))),
})

const unsignedDeviceInfoSchema = Schema.Struct({
  deviceDisplayName: Schema.optional(Schema.String),
})

const deviceInformationSchema = Schema.Struct({
  userId: UserId.schema,
  deviceId: Schema.String,
  algorithms: Schema.Array(Schema.String),
  keys: Schema.Record(Schema.String, Schema.String),
  signatures: Schema.Record(UserId.schema, Schema.Record(Schema.String, Schema.String)),
  unsigned: Schema.optional(unsignedDeviceInfoSchema),
})

const crossSigningKeySchema = Schema.Struct({
  keys: Schema.Record(Schema.String, Schema.String),
  usage: Schema.Array(Schema.String),
  userId: UserId.schema,
  signatures: Schema.optional(Schema.Unknown), //TODO: Signatures Type
})

const schema = Schema.Struct({
  failures: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  deviceKeys: Schema.optional(Schema.Record(UserId.schema, Schema.Record(Schema.String, deviceInformationSchema))),
  masterKeys: Schema.optional(Schema.Record(UserId.schema, crossSigningKeySchema)),
  selfSigningKeys: Schema.optional(Schema.Record(UserId.schema, crossSigningKeySchema)),
  userSigningKeys: Schema.optional(Schema.Record(UserId.schema, crossSigningKeySchema)),
})

/**
 * `POST /_matrix/client/v3/keys/query`
 *
 * @description
 * Returns the current devices and identity keys for the given users.
 *
 * @see https://spec.matrix.org/latest/client-server-api/#post_matrixclientv3keysquery
 */
export const postKeysQueryV3 = Effect.fn(function* (options: (typeof optionsSchema)['~type.make.in']) {
  const body = yield* optionsSchema.makeEffect(options).pipe(
    Effect.andThen(Schema.encodeEffect(optionsSchema.pipe(encodeSnakeCaseSchema))),
    Effect.andThen(body => HttpBody.json(body)),
  )

  return yield* makeEndpoint('POST', { auth: true, schema, body })`/v3/keys/query`
})

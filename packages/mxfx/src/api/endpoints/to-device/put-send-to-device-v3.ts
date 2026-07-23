import { Effect, Random, Schema } from 'effect'
import { HttpBody } from 'effect/unstable/http'

import { UserId } from '../../../branded/user-id.ts'
import { encodeSnakeCaseSchema } from '../../schema/encode-case.ts'
import { makeEndpoint } from '../endpoint.ts'

const optionsSchema = Schema.Struct({
  eventType: Schema.String,
  transactionId: Schema.optional(Schema.String),
  body: Schema.Union([
    Schema.Struct({ messages: Schema.Record(UserId.schema, Schema.Record(Schema.String, Schema.Unknown)) }), //TODO: Schema.Unknown should be eventContent
    Schema.String,
  ]),
})

const schema = Schema.Struct({})

/**
 * `PUT /_matrix/client/v3/sendToDevice/{eventType}/{txnId}`
 *
 * @description
 * This endpoint is used to send send-to-device events to a set of client devices.
 *
 * @see https://spec.matrix.org/latest/client-server-api/#put_matrixclientv3sendtodeviceeventtypetxnid
 */
export const putSendToDeviceV3 = Effect.fn(function* (options: typeof optionsSchema.Type) {
  const body = yield* Schema.encodeEffect(optionsSchema.pipe(encodeSnakeCaseSchema))(options).pipe(
    Effect.andThen(({ body }) =>
      typeof body === 'string' ? Effect.succeed(HttpBody.text(body, 'application/json')) : HttpBody.json(body),
    ),
  )

  const transactionId = options.transactionId ? options.transactionId : yield* Random.nextIntBetween(1, 10000000) // TODO: used be uuidv4 but was removed from random module into crypto, but haven't bothered to check how possible it is to DI anything here bc crypto gotta be injected

  return yield* makeEndpoint('PUT', { auth: true, schema, body })`/v3/sendToDevice/${options.eventType}/${transactionId}`
})

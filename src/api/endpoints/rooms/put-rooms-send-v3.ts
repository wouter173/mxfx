import { Effect, Schema, Random } from 'effect'
import { HttpBody } from 'effect/unstable/http'

import { EventId, RoomId } from '../../../branded'
import { encodeSnakeCaseSchema } from '../../schema/encode-case'
import { makeEndpoint, apiPath } from '../helpers'

const responseSchema = Schema.Struct({
  eventId: EventId.schema,
})

const commonOptionsSchema = Schema.Struct({
  roomId: RoomId.schema,
  transactionId: Schema.optional(Schema.String),
})

const commonMessageContentSchema = Schema.Struct({
  body: Schema.String,
  msgtype: Schema.String,
})

const optionsSchema = Schema.Union([
  //TODO: support more event types
  Schema.Struct({
    ...commonOptionsSchema.fields,
    eventType: Schema.Literal('m.room.message'),
    content: Schema.Union([
      Schema.Struct({
        ...commonMessageContentSchema.fields,
        'm.newContent': Schema.Struct({ body: Schema.String, msgtype: Schema.String }),
        'm.relatesTo': Schema.Struct({
          relType: Schema.Literal('m.replace'),
          eventId: EventId.schema,
        }),
      }),
      Schema.Struct({
        ...commonMessageContentSchema.fields,
      }),
    ]),
  }),
])

/**
 * `GET /_matrix/client/v3/rooms/{roomId}/send/{eventType}/{txnId}`
 *
 * @description
 * This endpoint is used to send a message event to a room. Message events allow access to historical events and pagination, making them
 * suited for “once-off” activity in a room.
 *
 * The body of the request should be the content object of the event; the fields in this object will vary depending on the type of event.
 * See Room Events for the m. event specification.
 *
 * @see https://spec.matrix.org/v1.17/client-server-api/#put_matrixclientv3roomsroomidsendeventtypetxnid
 */
export const putRoomsSendV3 = (options: typeof optionsSchema.Type) =>
  Effect.gen(function* () {
    const body = yield* Schema.encodeEffect(optionsSchema.pipe(encodeSnakeCaseSchema))(options).pipe(
      Effect.andThen(({ content }) => HttpBody.json(content)),
    )

    const transactionId = options.transactionId ? options.transactionId : yield* Random.nextUUIDv4

    return yield* makeEndpoint({
      path: apiPath()`/v3/rooms/${options.roomId}/send/${options.eventType}/${transactionId}`,
      method: 'PUT',
      auth: true,
      schema: responseSchema,
      body,
    })
  })

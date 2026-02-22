import { Effect, Schema } from 'effect'
import { makeEndpoint, apiPath } from '../../matrix-endpoint'
import { EventId, RoomId } from '../../../branded'
import { HttpBody } from '@effect/platform'

const responseSchema = Schema.Struct({
  eventId: EventId.schema.pipe(Schema.propertySignature, Schema.fromKey('event_id')),
})

const optionsSchema = Schema.Union(
  //TODO: support more event types
  Schema.Struct({
    eventType: Schema.Literal('m.room.message'),
    content: Schema.Struct({
      body: Schema.String,
      msgtype: Schema.String,
    }).pipe(
      Schema.extend(
        Schema.Union(
          Schema.Struct({
            'm.newContent': Schema.Struct({ body: Schema.String, msgtype: Schema.String }).pipe(
              Schema.propertySignature,
              Schema.fromKey('m.new_content'),
            ),
            'm.relatesTo': Schema.Struct({
              relType: Schema.Literal('m.replace').pipe(Schema.propertySignature, Schema.fromKey('rel_type')),
              eventId: EventId.schema.pipe(Schema.propertySignature, Schema.fromKey('event_id')),
            }).pipe(Schema.propertySignature, Schema.fromKey('m.relates_to')),
          }),
          Schema.Struct({}),
        ),
      ),
    ),
  }),
).pipe(
  Schema.extend(
    Schema.Struct({
      roomId: RoomId.schema,
      transactionId: Schema.optional(Schema.String),
    }),
  ),
)

/**
 * `GET /_matrix/client/v3/rooms/{roomId}/send/{eventType}/{txnId}`
 *
 * This endpoint is used to send a message event to a room. Message events allow access to historical events and pagination, making them
 * suited for “once-off” activity in a room.
 *
 * The body of the request should be the content object of the event; the fields in this object will vary depending on the type of event.
 * See Room Events for the m. event specification.
 *
 * @category Endpoints
 * @see https://spec.matrix.org/v1.17/client-server-api/#put_matrixclientv3roomsroomidsendeventtypetxnid
 */
export const putRoomsSendV3 = (options: typeof optionsSchema.Type) =>
  Effect.gen(function* () {
    const body = yield* Schema.encode(optionsSchema)(options).pipe(Effect.andThen(({ content }) => HttpBody.json(content)))

    const transactionId = options.transactionId ? options.transactionId : yield* Effect.sync(() => crypto.randomUUID())

    return yield* makeEndpoint({
      path: apiPath()`/v3/rooms/${options.roomId}/send/${options.eventType}/${transactionId}`,
      method: 'PUT',
      auth: true,
      schema: responseSchema,
      body,
    })
  })

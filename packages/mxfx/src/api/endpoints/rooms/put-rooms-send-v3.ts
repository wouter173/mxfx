import { Effect, Schema, Random } from 'effect'

import { EventId, RoomId } from '../../../branded/index.ts'
import { makeEndpoint } from '../endpoint.ts'
import * as RequestOptions from '../request-options.ts'

const schema = Schema.Struct({
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

const messageContentSchema = Schema.Union([
  Schema.Struct({
    ...commonMessageContentSchema.fields,
    'm.newContent': Schema.Struct({ body: Schema.String, msgtype: Schema.String }),
    'm.relatesTo': Schema.Struct({
      relType: Schema.Literal('m.replace'),
      eventId: EventId.schema,
    }),
  }),
  commonMessageContentSchema,
])

const eventTypeSchema = Schema.Literal('m.room.message')

const optionsSchema = Schema.Union([
  //TODO: support more event types
  Schema.Struct({
    ...commonOptionsSchema.fields,
    eventType: eventTypeSchema,
    content: messageContentSchema,
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
  (options.transactionId ? Effect.succeed(options.transactionId) : Random.nextIntBetween(1, 10000000).pipe(Effect.map(String))).pipe(
    Effect.flatMap(
      transactionId =>
        makeEndpoint('PUT', {
          auth: true,
          schema,
          body: RequestOptions.body(messageContentSchema, options.content),
        })`/v3/rooms/${RequestOptions.path(
          RoomId.schema,
          options.roomId,
        )}/send/${RequestOptions.path(eventTypeSchema, options.eventType)}/${RequestOptions.path(Schema.String, transactionId)}`,
    ),
  )

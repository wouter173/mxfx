import { Schema } from 'effect'
import { EventId } from '../../branded/event-id'
import { MxcUri } from '../../branded/mxc-uri'
import { RoomId } from '../../branded/room-id'
import { UserId } from '../../branded/user-id'

export const BaseEventSchema = Schema.Struct({
  type: Schema.String,
  content: Schema.Object, //TODO EventContent
})

//StrippedStateEvent

export const StrippedStateEventSchema = Schema.Struct({
  ...BaseEventSchema.fields,
  sender: UserId.schema,
  stateKey: Schema.propertySignature(Schema.String).pipe(Schema.fromKey('state_key')),
})

//ClientEvent

type ClientEvent = {
  type: string
  content: object //TODO EventContent
  eventId: EventId
  originServerTs: number
  roomId: RoomId
  sender: UserId
  stateKey?: string
  unsigned?: {
    age?: number
    membership?: string
    prevContent?: object //TODO EventContent
    redactedBecause?: ClientEvent
    transactionId?: string
  }
}

const ClientEventUnsignedFieldSchema = Schema.Struct({
  age: Schema.optional(Schema.Number.pipe(Schema.int())),
  membership: Schema.optional(Schema.String),
  prevContent: Schema.optional(Schema.Object).pipe(Schema.fromKey('prev_content')), //TODO EventContent
  redactedBecause: Schema.optional(
    Schema.suspend((): Schema.Schema<ClientEvent> => ClientEventSchema as unknown as Schema.Schema<ClientEvent>),
  ).pipe(Schema.fromKey('redacted_because')),
  transactionId: Schema.optional(Schema.String).pipe(Schema.fromKey('transaction_id')),
})

export const ClientEventSchema = Schema.Struct({
  ...BaseEventSchema.fields,
  eventId: EventId.schema.pipe(Schema.propertySignature, Schema.fromKey('event_id')),
  originServerTs: Schema.Number.pipe(Schema.int(), Schema.propertySignature, Schema.fromKey('origin_server_ts')),
  roomId: RoomId.schema.pipe(Schema.propertySignature, Schema.fromKey('room_id')),
  sender: UserId.schema,
  stateKey: Schema.String.pipe(Schema.optional, Schema.fromKey('state_key')),
  unsigned: Schema.optional(ClientEventUnsignedFieldSchema),
})

// ClientEventWithoutRoomId

type ClientEventWithoutRoomId = Omit<ClientEvent, 'room_id'> & {
  unsigned?: Omit<ClientEvent['unsigned'], 'redactedBecause'> & {
    redactedBecause?: ClientEventWithoutRoomId
  }
}

const ClientEventWithoutRoomIdSchemaUnsignedFieldSchema = Schema.Struct({
  ...ClientEventUnsignedFieldSchema.fields,
  redactedBecause: Schema.suspend(
    (): Schema.Schema<ClientEventWithoutRoomId> => ClientEventWithoutRoomIdSchema as unknown as Schema.Schema<ClientEventWithoutRoomId>,
  ).pipe(Schema.optional, Schema.fromKey('redacted_because')),
})

export const ClientEventWithoutRoomIdSchema = Schema.Struct({
  ...ClientEventSchema.omit('roomId').fields,
  unsigned: Schema.optional(ClientEventWithoutRoomIdSchemaUnsignedFieldSchema),
})

// room message events
export const RoomMessageEventTextCommonContentSchema = Schema.extend(
  Schema.Struct({
    msgtype: Schema.Union(Schema.Literal('m.text'), Schema.Literal('m.emote'), Schema.Literal('m.notice')),
    body: Schema.String,
  }),
  Schema.Union(
    Schema.Struct({
      format: Schema.Literal('org.matrix.custom.html'),
      formattedBody: Schema.String.pipe(Schema.propertySignature, Schema.fromKey('formatted_body')),
    }),
    Schema.Struct({
      format: Schema.Undefined,
      formattedBody: Schema.Undefined.pipe(Schema.propertySignature, Schema.fromKey('formatted_body')),
    }),
  ),
)

export const RoomMessageEventImageContentInfoThumbnailInfoSchema = Schema.Struct({
  h: Schema.optional(Schema.Number.pipe(Schema.int())),
  w: Schema.optional(Schema.Number.pipe(Schema.int())),
  size: Schema.optional(Schema.Number.pipe(Schema.int())),
  mimetype: Schema.optional(Schema.String),
})

export const RoomMessageEventImageContentInfoSchema = Schema.Struct({
  h: Schema.optional(Schema.Number.pipe(Schema.int())),
  w: Schema.optional(Schema.Number.pipe(Schema.int())),
  size: Schema.optional(Schema.Number.pipe(Schema.int())),
  mimetype: Schema.optional(Schema.String),
  thumbnailInfo: RoomMessageEventImageContentInfoThumbnailInfoSchema.pipe(Schema.optional, Schema.fromKey('thumbnail_info')),
  thumbnailUrl: MxcUri.schema.pipe(Schema.optional, Schema.fromKey('thumbnail_url')),
  thumbnailFile: Schema.Any.pipe(Schema.optional, Schema.fromKey('thumbnail_file')), //TODO: EncryptedFile
})

export const RoomMessageEventImageContentSchema = Schema.extend(
  Schema.Struct({
    msgtype: Schema.Literal('m.image'),
    body: Schema.String, // If filename is not set or the value of both properties are identical, this is the filename of the original upload. Otherwise, this is a caption for the image.
    filename: Schema.optional(Schema.String),
    info: Schema.optional(RoomMessageEventImageContentInfoSchema),
    url: MxcUri.schema,
    file: Schema.Any, //TODO: EncryptedFile
  }),
  Schema.Union(
    Schema.Struct({
      format: Schema.Literal('org.matrix.custom.html'),
      formattedBody: Schema.String.pipe(Schema.propertySignature, Schema.fromKey('formatted_body')),
    }),
    Schema.Struct({
      format: Schema.Undefined,
      formattedBody: Schema.Undefined.pipe(Schema.propertySignature, Schema.fromKey('formatted_body')),
    }),
  ),
)

//TODO: m.file, m.audio, m.location, m.video

export const RoomMessageEventPartialSchema = Schema.Struct({
  type: Schema.Literal('m.room.message'),
  content: Schema.Union(RoomMessageEventTextCommonContentSchema, RoomMessageEventImageContentSchema),
})

// room state events
export const RoomNameEventPartialSchema = Schema.Struct({
  type: Schema.Literal('m.room.name'),
  content: Schema.Struct({
    name: Schema.String,
  }),
})

export const RoomTopicEventPartialSchema = Schema.Struct({
  type: Schema.Literal('m.room.topic'),
  content: Schema.Struct({
    topic: Schema.String,
  }),
})

export const RoomAvatarEventPartialSchema = Schema.Struct({
  type: Schema.Literal('m.room.avatar'),
  content: Schema.Struct({
    url: MxcUri.schema,
    info: Schema.optional(
      Schema.Struct({
        mimetype: Schema.String,
        size: Schema.Number.pipe(Schema.int()),
        width: Schema.Number.pipe(Schema.int()),
        height: Schema.Number.pipe(Schema.int()),
      }),
    ),
    //TODO thumbnail_url, thumbnail_info
  }),
})

export const RoomPinnedEventsEventPartialSchema = Schema.Struct({
  type: Schema.Literal('m.room.pinned_events'),
  content: Schema.Struct({
    pinned: Schema.Array(EventId.schema),
  }),
})

export const AccountDataSchema = Schema.Struct({
  events: Schema.Array(BaseEventSchema),
})

export const TimelineSchema = Schema.Struct({
  events: Schema.optional(Schema.Array(ClientEventWithoutRoomIdSchema)),
  limited: Schema.optional(Schema.Boolean),
  prevBatch: Schema.String.pipe(Schema.optional, Schema.fromKey('prev_batch')),
})

export const StateSchema = Schema.Struct({ events: Schema.Array(ClientEventWithoutRoomIdSchema) })

export const RoomMessageV3ResponseSchema = Schema.Struct({
  chunk: Schema.Array(ClientEventSchema),
  start: Schema.String,
  end: Schema.optional(Schema.String),
  state: Schema.optional(Schema.Array(ClientEventSchema)),
})

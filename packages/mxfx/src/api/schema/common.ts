import { Schema } from 'effect'
import { EventIdSchema, MxcUriSchema, RoomIdSchema, UserIdSchema, type EventIdType, type RoomIdType, type UserIdType } from '../../branded'

export const BaseEventSchema = Schema.Struct({
  type: Schema.String,
  content: Schema.Object, //TODO EventContent
})

//StrippedStateEvent

export const StrippedStateEventSchema = Schema.Struct({
  ...BaseEventSchema.fields,
  sender: UserIdSchema,
  state_key: Schema.String,
})

//ClientEvent

type ClientEvent = {
  type: string
  content: object //TODO EventContent
  event_id: EventIdType
  origin_server_ts: number
  room_id: RoomIdType
  sender: UserIdType
  state_key?: string
  unsigned?: {
    age?: number
    membership?: string
    prev_content?: object //TODO EventContent
    redacted_because?: ClientEvent
    transaction_id?: string
  }
}

const ClientEventUnsignedFieldSchema = Schema.Struct({
  age: Schema.optional(Schema.Number.pipe(Schema.int())),
  membership: Schema.optional(Schema.String),
  prev_content: Schema.optional(Schema.Object), //TODO EventContent
  redacted_because: Schema.optional(
    Schema.suspend((): Schema.Schema<ClientEvent> => ClientEventSchema as unknown as Schema.Schema<ClientEvent>),
  ),
  transaction_id: Schema.optional(Schema.String),
})

export const ClientEventSchema = Schema.Struct({
  ...BaseEventSchema.fields,
  event_id: EventIdSchema,
  origin_server_ts: Schema.Number.pipe(Schema.int()),
  room_id: RoomIdSchema,
  sender: UserIdSchema,
  state_key: Schema.optional(Schema.String),
  unsigned: Schema.optional(ClientEventUnsignedFieldSchema),
})

// ClientEventWithoutRoomId

type ClientEventWithoutRoomId = Omit<ClientEvent, 'room_id'> & {
  unsigned?: Omit<ClientEvent['unsigned'], 'redacted_because'> & {
    redacted_because?: ClientEventWithoutRoomId
  }
}

const ClientEventWithoutRoomIdSchemaUnsignedFieldSchema = Schema.Struct({
  ...ClientEventUnsignedFieldSchema.fields,
  redacted_because: Schema.optional(
    Schema.suspend(
      (): Schema.Schema<ClientEventWithoutRoomId> => ClientEventWithoutRoomIdSchema as unknown as Schema.Schema<ClientEventWithoutRoomId>,
    ),
  ),
})

export const ClientEventWithoutRoomIdSchema = Schema.Struct({
  ...ClientEventSchema.omit('room_id').fields,
  unsigned: Schema.optional(ClientEventWithoutRoomIdSchemaUnsignedFieldSchema),
})

// room message events
export const RoomMessageEventTextCommonContentSchema = Schema.extend(
  Schema.Struct({
    msgtype: Schema.Union(Schema.Literal('m.text'), Schema.Literal('m.emote'), Schema.Literal('m.notice')),
    body: Schema.String,
  }),
  Schema.Union(
    Schema.Struct({ format: Schema.Literal('org.matrix.custom.html'), formatted_body: Schema.String }),
    Schema.Struct({ format: Schema.Undefined, formatted_body: Schema.Undefined }),
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
  thumbnail_info: Schema.optional(RoomMessageEventImageContentInfoThumbnailInfoSchema),
  thumbnail_url: Schema.optional(MxcUriSchema),
  thumbnail_file: Schema.optional(Schema.Any), //TODO: EncryptedFile
})

export const RoomMessageEventImageContentSchema = Schema.extend(
  Schema.Struct({
    msgtype: Schema.Literal('m.image'),
    body: Schema.String, // If filename is not set or the value of both properties are identical, this is the filename of the original upload. Otherwise, this is a caption for the image.
    filename: Schema.optional(Schema.String),
    info: Schema.optional(RoomMessageEventImageContentInfoSchema),
    url: MxcUriSchema,
    file: Schema.Any, //TODO: EncryptedFile
  }),
  Schema.Union(
    Schema.Struct({ format: Schema.Literal('org.matrix.custom.html'), formatted_body: Schema.String }),
    Schema.Struct({ format: Schema.Undefined, formatted_body: Schema.Undefined }),
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
    url: MxcUriSchema,
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
    pinned: Schema.Array(EventIdSchema),
  }),
})

export const nullable = <A, I>(s: Schema.Schema<A, I>) =>
  Schema.transform(Schema.NullishOr(s), Schema.Union(Schema.typeSchema(s), Schema.Undefined), {
    strict: true,
    decode: value => (value === null ? undefined : value),
    encode: value => value,
  })

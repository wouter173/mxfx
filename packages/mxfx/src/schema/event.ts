import { Schema, SchemaGetter, String, Struct } from 'effect'
import type { Codec } from 'effect/Schema'

import { EventId, MxcUri, RoomId, UserId } from '../branded/index.ts'

export const baseEvent = Schema.Unknown

const transformKeys = (value: unknown, transform: (key: string) => string): unknown => {
  if (Array.isArray(value)) {
    return value.map(item => transformKeys(item, transform))
  }

  if (typeof value !== 'object' || value === null) {
    return value
  }

  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [transform(key), transformKeys(nested, transform)]))
}

const redactedEvent = <T, E>(schema: () => Schema.Codec<T, E>): Schema.Codec<T, unknown> =>
  Schema.Any.pipe(
    Schema.decodeTo(Schema.suspend(schema), {
      decode: SchemaGetter.transform(value => transformKeys(value, String.snakeToCamel) as E),
      encode: SchemaGetter.transform(value => transformKeys(value, String.camelToSnake)),
    }),
  )

//StrippedStateEvent

export const strippedStateEvent = Schema.Struct({
  type: Schema.String,
  content: Schema.Any, //TODO EventContent
  sender: UserId.schema,
  stateKey: Schema.String,
})

//ClientEvent

export class ClientEventUnsigned extends Schema.Opaque<ClientEventUnsigned>()(
  Schema.Struct({
    age: Schema.optional(Schema.Int),
    membership: Schema.optional(Schema.String),
    prevContent: Schema.optional(Schema.Any),
    redactedBecause: Schema.optional(redactedEvent((): Schema.Codec<ClientEvent, ClientEventEncoded> => ClientEvent)),
    transactionId: Schema.optional(Schema.String),
  }),
) {}

export class ClientEvent extends Schema.Opaque<ClientEvent>()(
  Schema.Struct({
    type: Schema.String,
    content: Schema.Any, //TODO EventContent
    eventId: EventId.schema,
    originServerTs: Schema.Int,
    roomId: RoomId.schema,
    sender: UserId.schema,
    stateKey: Schema.optional(Schema.String),
    unsigned: Schema.optional(ClientEventUnsigned),
  }),
) {}

interface ClientEventEncoded extends Codec.Encoded<typeof ClientEvent> {}

export class ClientEventWithoutRoomIdUnsigned extends Schema.Opaque<ClientEventWithoutRoomIdUnsigned>()(
  Schema.Struct({
    ...ClientEventUnsigned.fields,
    redactedBecause: Schema.optional(
      redactedEvent((): Schema.Codec<ClientEventWithoutRoomId, ClientEventWithoutRoomIdEncoded> => ClientEventWithoutRoomId),
    ),
  }),
) {}

export class ClientEventWithoutRoomId extends Schema.Opaque<ClientEventWithoutRoomId>()(
  Schema.Struct({
    ...ClientEvent.mapFields(Struct.omit(['roomId'])).fields,
    unsigned: Schema.optional(ClientEventWithoutRoomIdUnsigned),
  }),
) {}

interface ClientEventWithoutRoomIdEncoded extends Codec.Encoded<typeof ClientEventWithoutRoomId> {}

// room message events
const roomMessageEventTextCommonContentFormatted = Schema.Struct({
  msgtype: Schema.Union([Schema.Literal('m.text'), Schema.Literal('m.emote'), Schema.Literal('m.notice')]),
  body: Schema.String,
  format: Schema.Literal('org.matrix.custom.html'),
  formattedBody: Schema.String,
})

const roomMessageEventTextCommonContentPlain = Schema.Struct({
  msgtype: Schema.Union([Schema.Literal('m.text'), Schema.Literal('m.emote'), Schema.Literal('m.notice')]),
  body: Schema.String,
  format: Schema.Undefined,
  formattedBody: Schema.Undefined,
})

export const roomMessageEventTextCommonContent = Schema.Union([
  roomMessageEventTextCommonContentFormatted,
  roomMessageEventTextCommonContentPlain,
])

export const roomMessageEventImageContentInfoThumbnailInfo = Schema.Struct({
  h: Schema.optional(Schema.Int),
  w: Schema.optional(Schema.Int),
  size: Schema.optional(Schema.Int),
  mimetype: Schema.optional(Schema.String),
})

export const roomMessageEventImageContentInfo = Schema.Struct({
  h: Schema.optional(Schema.Int),
  w: Schema.optional(Schema.Int),
  size: Schema.optional(Schema.Int),
  mimetype: Schema.optional(Schema.String),
  thumbnailInfo: Schema.optional(roomMessageEventImageContentInfoThumbnailInfo),
  thumbnailUrl: Schema.optional(MxcUri.schema),
  thumbnailFile: Schema.optional(Schema.Any), //TODO: EncryptedFile
})

const roomMessageEventImageContentFormatted = Schema.Struct({
  msgtype: Schema.Literal('m.image'),
  body: Schema.String,
  filename: Schema.optional(Schema.String),
  info: Schema.optional(roomMessageEventImageContentInfo),
  url: MxcUri.schema,
  file: Schema.Any,
  format: Schema.Literal('org.matrix.custom.html'),
  formattedBody: Schema.String,
})

const roomMessageEventImageContentPlain = Schema.Struct({
  msgtype: Schema.Literal('m.image'),
  body: Schema.String,
  filename: Schema.optional(Schema.String),
  info: Schema.optional(roomMessageEventImageContentInfo),
  url: MxcUri.schema,
  file: Schema.Any,
  format: Schema.Undefined,
  formattedBody: Schema.Undefined,
})

export const roomMessageEventImageContent = Schema.Union([roomMessageEventImageContentFormatted, roomMessageEventImageContentPlain])

//TODO: m.file, m.audio, m.location, m.video

export const roomMessageEventPartial = Schema.Struct({
  type: Schema.Literal('m.room.message'),
  content: Schema.Union([roomMessageEventTextCommonContent, roomMessageEventImageContent]),
})

// room state events
export const roomNameStateEventPartial = Schema.Struct({
  type: Schema.Literal('m.room.name'),
  content: Schema.StructWithRest(
    Schema.Struct({ name: Schema.String }), //
    [Schema.Record(Schema.String, Schema.Any)],
  ),
})

export const roomTopicStateEventPartial = Schema.Struct({
  type: Schema.Literal('m.room.topic'),
  content: Schema.Struct({
    topic: Schema.String,
  }),
})

export const roomAvatarStateEventPartial = Schema.Struct({
  type: Schema.Literal('m.room.avatar'),
  content: Schema.Struct({
    url: MxcUri.schema,
    info: Schema.optional(
      Schema.Struct({
        mimetype: Schema.String,
        size: Schema.Int,
        width: Schema.Int,
        height: Schema.Int,
      }),
    ),
    //TODO thumbnail_url, thumbnail_info
  }),
})

export const roomPinnedEventsStateEventPartial = Schema.Struct({
  type: Schema.Literal('m.room.pinned_events'),
  content: Schema.Struct({
    pinned: Schema.Array(EventId.schema),
  }),
})

const stateEventWithoutRoomIdBase = Schema.Struct({
  ...ClientEventWithoutRoomId.fields,
  stateKey: Schema.String,
})

const stateEventBase = Schema.Struct({
  ...ClientEvent.fields,
  stateKey: Schema.String,
})

export const stateEventWithoutRoomId = Schema.Union([
  stateEventWithoutRoomIdBase,
  Schema.Struct({ ...stateEventWithoutRoomIdBase.fields, ...roomNameStateEventPartial.fields }),
  Schema.Struct({ ...stateEventWithoutRoomIdBase.fields, ...roomTopicStateEventPartial.fields }),
  Schema.Struct({ ...stateEventWithoutRoomIdBase.fields, ...roomAvatarStateEventPartial.fields }),
  Schema.Struct({ ...stateEventWithoutRoomIdBase.fields, ...roomPinnedEventsStateEventPartial.fields }),
])

export const stateEvent = Schema.Union([
  stateEventBase,
  Schema.Struct({ ...stateEventBase.fields, ...roomNameStateEventPartial.fields }),
  Schema.Struct({ ...stateEventBase.fields, ...roomTopicStateEventPartial.fields }),
  Schema.Struct({ ...stateEventBase.fields, ...roomAvatarStateEventPartial.fields }),
  Schema.Struct({ ...stateEventBase.fields, ...roomPinnedEventsStateEventPartial.fields }),
])

export const roomEventWithoutRoomId = Schema.Union([
  stateEventWithoutRoomId,
  ClientEventWithoutRoomId,
  Schema.Struct({ ...ClientEventWithoutRoomId.fields, ...roomMessageEventPartial.fields }),
])

export const roomEvent = Schema.Union([stateEvent, Schema.Struct({ ...ClientEvent.fields, ...roomMessageEventPartial.fields })])

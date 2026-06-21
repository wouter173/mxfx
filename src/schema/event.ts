import { Schema, SchemaGetter, String, Struct } from 'effect'
import type { Codec } from 'effect/Schema'

import { EventId, MxcUri, RoomId, UserId } from '../branded'

export const BaseEvent = Schema.Unknown

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

export const StrippedStateEvent = Schema.Struct({
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
const RoomMessageEventTextCommonContentFormatted = Schema.Struct({
  msgtype: Schema.Union([Schema.Literal('m.text'), Schema.Literal('m.emote'), Schema.Literal('m.notice')]),
  body: Schema.String,
  format: Schema.Literal('org.matrix.custom.html'),
  formattedBody: Schema.String,
})

const RoomMessageEventTextCommonContentPlain = Schema.Struct({
  msgtype: Schema.Union([Schema.Literal('m.text'), Schema.Literal('m.emote'), Schema.Literal('m.notice')]),
  body: Schema.String,
  format: Schema.Undefined,
  formattedBody: Schema.Undefined,
})

export const RoomMessageEventTextCommonContent = Schema.Union([
  RoomMessageEventTextCommonContentFormatted,
  RoomMessageEventTextCommonContentPlain,
])

export const RoomMessageEventImageContentInfoThumbnailInfo = Schema.Struct({
  h: Schema.optional(Schema.Int),
  w: Schema.optional(Schema.Int),
  size: Schema.optional(Schema.Int),
  mimetype: Schema.optional(Schema.String),
})

export const RoomMessageEventImageContentInfo = Schema.Struct({
  h: Schema.optional(Schema.Int),
  w: Schema.optional(Schema.Int),
  size: Schema.optional(Schema.Int),
  mimetype: Schema.optional(Schema.String),
  thumbnailInfo: Schema.optional(RoomMessageEventImageContentInfoThumbnailInfo),
  thumbnailUrl: Schema.optional(MxcUri.schema),
  thumbnailFile: Schema.optional(Schema.Any), //TODO: EncryptedFile
})

const RoomMessageEventImageContentFormatted = Schema.Struct({
  msgtype: Schema.Literal('m.image'),
  body: Schema.String,
  filename: Schema.optional(Schema.String),
  info: Schema.optional(RoomMessageEventImageContentInfo),
  url: MxcUri.schema,
  file: Schema.Any,
  format: Schema.Literal('org.matrix.custom.html'),
  formattedBody: Schema.String,
})

const RoomMessageEventImageContentPlain = Schema.Struct({
  msgtype: Schema.Literal('m.image'),
  body: Schema.String,
  filename: Schema.optional(Schema.String),
  info: Schema.optional(RoomMessageEventImageContentInfo),
  url: MxcUri.schema,
  file: Schema.Any,
  format: Schema.Undefined,
  formattedBody: Schema.Undefined,
})

export const RoomMessageEventImageContent = Schema.Union([RoomMessageEventImageContentFormatted, RoomMessageEventImageContentPlain])

//TODO: m.file, m.audio, m.location, m.video

export const RoomMessageEventPartial = Schema.Struct({
  type: Schema.Literal('m.room.message'),
  content: Schema.Union([RoomMessageEventTextCommonContent, RoomMessageEventImageContent]),
})

// room state events
export const RoomNameStateEventPartial = Schema.Struct({
  type: Schema.Literal('m.room.name'),
  content: Schema.StructWithRest(
    Schema.Struct({ name: Schema.String }), //
    [Schema.Record(Schema.String, Schema.Any)],
  ),
})

export const RoomTopicStateEventPartial = Schema.Struct({
  type: Schema.Literal('m.room.topic'),
  content: Schema.Struct({
    topic: Schema.String,
  }),
})

export const RoomAvatarStateEventPartial = Schema.Struct({
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

export const RoomPinnedEventsStateEventPartial = Schema.Struct({
  type: Schema.Literal('m.room.pinned_events'),
  content: Schema.Struct({
    pinned: Schema.Array(EventId.schema),
  }),
})

const StateEventWithoutRoomIdBase = Schema.Struct({
  ...ClientEventWithoutRoomId.fields,
  stateKey: Schema.String,
})

const StateEventBase = Schema.Struct({
  ...ClientEvent.fields,
  stateKey: Schema.String,
})

export const StateEventWithoutRoomId = Schema.Union([
  StateEventWithoutRoomIdBase,
  Schema.Struct({ ...StateEventWithoutRoomIdBase.fields, ...RoomNameStateEventPartial.fields }),
  Schema.Struct({ ...StateEventWithoutRoomIdBase.fields, ...RoomTopicStateEventPartial.fields }),
  Schema.Struct({ ...StateEventWithoutRoomIdBase.fields, ...RoomAvatarStateEventPartial.fields }),
  Schema.Struct({ ...StateEventWithoutRoomIdBase.fields, ...RoomPinnedEventsStateEventPartial.fields }),
])

export const StateEvent = Schema.Union([
  StateEventBase,
  Schema.Struct({ ...StateEventBase.fields, ...RoomNameStateEventPartial.fields }),
  Schema.Struct({ ...StateEventBase.fields, ...RoomTopicStateEventPartial.fields }),
  Schema.Struct({ ...StateEventBase.fields, ...RoomAvatarStateEventPartial.fields }),
  Schema.Struct({ ...StateEventBase.fields, ...RoomPinnedEventsStateEventPartial.fields }),
])

export const RoomEventWithoutRoomId = Schema.Union([
  StateEventWithoutRoomId,
  ClientEventWithoutRoomId,
  Schema.Struct({ ...ClientEventWithoutRoomId.fields, ...RoomMessageEventPartial.fields }),
])

export const RoomEvent = Schema.Union([StateEvent, Schema.Struct({ ...ClientEvent.fields, ...RoomMessageEventPartial.fields })])

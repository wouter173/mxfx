import { Schema, Struct } from 'effect'

import { EventId } from '../../branded/event-id'
import { MxcUri } from '../../branded/mxc-uri'
import { RoomId } from '../../branded/room-id'
import { UserId } from '../../branded/user-id'

export const BaseEvent = Schema.Unknown

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
    redactedBecause: Schema.optional(Schema.suspend((): Schema.Codec<ClientEvent, ClientEventEncoded> => ClientEvent)),
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

interface ClientEventEncoded extends Schema.Codec.Encoded<typeof ClientEvent> {}

export class ClientEventWithoutRoomIdUnsigned extends Schema.Opaque<ClientEventWithoutRoomIdUnsigned>()(
  Schema.Struct({
    ...ClientEventUnsigned.fields,
    redactedBecause: Schema.optional(
      Schema.suspend((): Schema.Codec<ClientEventWithoutRoomId, ClientEventWithoutRoomIdEncoded> => ClientEventWithoutRoomId),
    ),
  }),
) {}

export class ClientEventWithoutRoomId extends Schema.Opaque<ClientEventWithoutRoomId>()(
  Schema.Struct({
    ...ClientEvent.mapFields(Struct.omit(['roomId'])).fields,
    unsigned: Schema.optional(ClientEventWithoutRoomIdUnsigned),
  }),
) {}

interface ClientEventWithoutRoomIdEncoded extends Schema.Codec.Encoded<typeof ClientEventWithoutRoomId> {}

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
export const RoomNameEventPartial = Schema.Struct({
  type: Schema.Literal('m.room.name'),
  content: Schema.Struct({
    name: Schema.String,
  }),
})

export const RoomTopicEventPartial = Schema.Struct({
  type: Schema.Literal('m.room.topic'),
  content: Schema.Struct({
    topic: Schema.String,
  }),
})

export const RoomAvatarEventPartial = Schema.Struct({
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

export const RoomPinnedEventsEventPartial = Schema.Struct({
  type: Schema.Literal('m.room.pinned_events'),
  content: Schema.Struct({
    pinned: Schema.Array(EventId.schema),
  }),
})

export const AccountData = Schema.Struct({
  events: Schema.Array(BaseEvent),
})

export const RoomMessageEvent = Schema.Struct({
  ...ClientEventWithoutRoomId.fields,
  ...RoomMessageEventPartial.fields,
})

export const Timeline = Schema.Struct({
  events: Schema.optional(Schema.Array(Schema.Union([ClientEventWithoutRoomId, RoomMessageEvent]))),
  limited: Schema.optional(Schema.Boolean),
  prevBatch: Schema.optional(Schema.String),
})

export const StateSchema = Schema.Struct({ events: Schema.Array(ClientEventWithoutRoomId) })

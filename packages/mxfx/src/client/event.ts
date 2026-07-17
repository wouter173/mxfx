import { Result, Schema, Stream } from 'effect'
import type { Predicate } from 'effect/Predicate'

import type { endpoints } from '../api/index.ts'
import type { RoomId } from '../branded/index.ts'
import type { ClientEventWithoutRoomId } from '../schema/index.ts'

export type SyncFrame = typeof endpoints.getSyncV3ResponseSchema.Type

export type EventLike = {
  readonly roomId: RoomId
  readonly type: string
  readonly content: unknown
}

/** A room event whose type and content have been refined by `makeEvent`. */
export type ClientEventOf<Type extends string, Content> = Omit<typeof ClientEventWithoutRoomId.Type, 'type' | 'content'> & {
  readonly roomId: RoomId
  readonly type: Type
  readonly content: Content
}

/** The high-level room collections exposed by sync. */
export type EventBucket = 'rooms.joined'

export interface EventUnit<Event extends EventLike> {
  readonly stream: (frames: Stream.Stream<SyncFrame>) => Stream.Stream<Event>
}

export interface MakeEventOptions<Type extends string, ContentSchema extends Schema.Decoder<unknown>> {
  readonly type: Type
  readonly bucket: EventBucket
  /** Schema used to decode and refine the event's `content`. */
  readonly schema: ContentSchema
  /** An optional refinement applied after type and content validation. */
  readonly predicate?: Predicate<ClientEventOf<Type, ContentSchema['Type']>>
}

export type EventDefinition<Type extends string, ContentSchema extends Schema.Decoder<unknown>> = EventUnit<
  ClientEventOf<Type, ContentSchema['Type']>
> &
  Readonly<Required<MakeEventOptions<Type, ContentSchema>>>

const joinedRoomEvents = (frame: SyncFrame) =>
  Object.entries(frame.rooms?.join ?? {}).flatMap(([roomId, room]) => {
    // `state_after` supersedes `state` when requested. Reading one or the
    // other prevents the same state event from being delivered twice.
    const state = room.stateAfter?.events ?? room.state?.events ?? []
    const timeline = room.timeline?.events ?? []

    return [...state, ...timeline].map(event => ({ ...event, roomId: roomId as RoomId }))
  })

/**
 * Defines a typed subscription to Matrix room events.
 *
 * Events are selected from the configured sync bucket, checked against their
 * Matrix event type, decoded with the content schema, and finally passed to
 * the optional predicate. Invalid content is ignored rather than terminating
 * the client's long-running sync subscription.
 */
export const makeEvent = <const Type extends string, ContentSchema extends Schema.Decoder<unknown>>(
  options: MakeEventOptions<Type, ContentSchema>,
): EventDefinition<Type, ContentSchema> => {
  type Event = ClientEventOf<Type, ContentSchema['Type']>

  const predicate: Predicate<Event> = options.predicate ?? (() => true)
  const decodeContent = Schema.decodeUnknownOption(options.schema)

  const stream = (frames: Stream.Stream<SyncFrame>): Stream.Stream<Event> =>
    frames.pipe(
      Stream.flatMap(frame => Stream.fromIterable(joinedRoomEvents(frame))),
      Stream.filterMap(event => {
        if (event.type !== options.type) return Result.fail(event)

        return Result.fromOption(decodeContent(event.content), () => event).pipe(
          Result.map(content => ({ ...event, type: options.type, content }) as Event),
        )
      }),
      Stream.filter(predicate),
    )

  return {
    type: options.type,
    bucket: options.bucket,
    schema: options.schema,
    predicate,
    stream,
  }
}

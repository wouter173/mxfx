import { describe, expect, it } from '@effect/vitest'
import { Effect, Schema } from 'effect'
import { ClientEventSchema, RoomMessageEventPartialSchema } from './common'
import { nullable } from './transform'

const decode = Schema.decode(
  Schema.Struct({
    ...ClientEventSchema.fields,
    ...RoomMessageEventPartialSchema.fields,
  }),
)

describe('event', () => {
  it.effect('should be valid RoomId', () =>
    Effect.gen(function* () {
      expect(
        yield* decode({
          content: {
            body: 'This is an example text message',
            format: 'org.matrix.custom.html',
            formatted_body: '<b>This is an example text message</b>',
            msgtype: 'm.text',
          },
          event_id: '$143273582443PhrSn:example.org',
          origin_server_ts: 1432735824653,
          room_id: '!jEsUZKDJdhlrceRyVU:example.org',
          sender: '@example:example.org',
          type: 'm.room.message',
          unsigned: {
            age: 1234,
            membership: 'join',
          },
        }),
      ).toStrictEqual({
        content: {
          body: 'This is an example text message',
          format: 'org.matrix.custom.html',
          formattedBody: '<b>This is an example text message</b>',
          msgtype: 'm.text',
        },
        eventId: '$143273582443PhrSn:example.org',
        originServerTs: 1432735824653,
        roomId: '!jEsUZKDJdhlrceRyVU:example.org',
        sender: '@example:example.org',
        type: 'm.room.message',
        unsigned: { age: 1234, membership: 'join' },
      })
    }),
  )
})

describe('nullable helper', () => {
  it.effect('should en- and decode nullable schema', () =>
    Effect.gen(function* () {
      const NullableStringSchema = nullable(Schema.String)
      expect(yield* Schema.decode(NullableStringSchema)(null)).toBeUndefined()
      expect(yield* Schema.decode(NullableStringSchema)('hello')).toBe('hello')
      expect(yield* Schema.encode(NullableStringSchema)(undefined)).toBeUndefined()
      expect(yield* Schema.encode(NullableStringSchema)('hello')).toBe('hello')
    }),
  )
  it.effect('should en- and decode nullable optional schema', () =>
    Effect.gen(function* () {
      const NullableOptionalStringSchema = Schema.Struct({
        value: Schema.optional(nullable(Schema.String)),
      })
      expect(yield* Schema.decode(NullableOptionalStringSchema)({ value: null })).toStrictEqual({ value: undefined })
      expect(yield* Schema.decode(NullableOptionalStringSchema)({ value: 'hello' })).toStrictEqual({ value: 'hello' })
      expect(yield* Schema.decode(NullableOptionalStringSchema)({})).toStrictEqual({})
      expect(yield* Schema.encode(NullableOptionalStringSchema)({ value: undefined })).toStrictEqual({ value: undefined })
      expect(yield* Schema.encode(NullableOptionalStringSchema)({})).toStrictEqual({})
    }),
  )
})

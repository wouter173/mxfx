import { describe, expect, it } from '@effect/vitest'
import { Effect, Schema } from 'effect'
import { ClientEventSchema, RoomMessageEventPartialSchema } from './common'

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
          formatted_body: '<b>This is an example text message</b>',
          msgtype: 'm.text',
        },
        event_id: '$143273582443PhrSn:example.org',
        origin_server_ts: 1432735824653,
        room_id: '!jEsUZKDJdhlrceRyVU:example.org',
        sender: '@example:example.org',
        type: 'm.room.message',
        unsigned: { age: 1234, membership: 'join' },
      })
    }),
  )
})

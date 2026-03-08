import { describe, expect, expectTypeOf, it } from '@effect/vitest'
import { Effect, Schema } from 'effect'
import type { Effect as FxEffect } from 'effect/Effect'
import { ClientEvent, ClientEventWithoutRoomId, RoomMessageEventPartial } from './common'
import { encodeSnakeCaseKeys } from './encode-case'
import { EventId, UserId } from '../../branded'

describe('event schema', () => {
  it('decodeEffect keeps typed recursive redactedBecause', () => {
    const decodeClientEventWithoutRoomId = Schema.decodeEffect(ClientEventWithoutRoomId)

    type DecodedClientEventWithoutRoomId =
      ReturnType<typeof decodeClientEventWithoutRoomId> extends FxEffect<infer Success, infer _Error, infer _Context> ? Success : never
    type DecodedRecursiveRedactedBecause = NonNullable<NonNullable<DecodedClientEventWithoutRoomId['unsigned']>['redactedBecause']>

    expectTypeOf<DecodedRecursiveRedactedBecause>().toExtend<{
      eventId: Schema.Schema.Type<typeof EventId.schema>
      sender: Schema.Schema.Type<typeof UserId.schema>
      originServerTs: number
    }>()
  })

  it('has typed recursive redactedBecause', () => {
    type RecursiveRedactedBecause = NonNullable<
      NonNullable<Schema.Schema.Type<typeof ClientEventWithoutRoomId>['unsigned']>['redactedBecause']
    >

    expectTypeOf<RecursiveRedactedBecause>().toExtend<{
      eventId: Schema.Schema.Type<typeof EventId.schema>
      sender: Schema.Schema.Type<typeof UserId.schema>
      originServerTs: number
    }>()
  })

  it.effect('should be valid RoomId', () =>
    Effect.gen(function* () {
      const schema = Schema.Struct({
        ...ClientEvent.fields,
        ...RoomMessageEventPartial.fields,
      }).pipe(encodeSnakeCaseKeys)

      const output = yield* Schema.decodeEffect(schema)({
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
      })

      expect(output).toStrictEqual({
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

  it('should decode recursive unsigned.redactedBecause chain', () =>
    Effect.gen(function* () {
      const output = yield* Schema.decodeEffect(ClientEventWithoutRoomId)({
        type: 'm.room.message',
        content: {
          body: 'root',
          format: 'org.matrix.custom.html',
          formattedBody: '<b>root</b>',
          msgtype: 'm.text',
        },
        eventId: yield* EventId.make('$root:example.org'),
        sender: yield* UserId.make('@example:example.org'),
        originServerTs: 1,
        unsigned: {
          membership: 'join',
          redactedBecause: {
            type: 'm.room.message',
            content: {
              body: 'child',
              format: 'org.matrix.custom.html',
              formattedBody: '<b>child</b>',
              msgtype: 'm.text',
            },
            eventId: yield* EventId.make('$child:example.org'),
            sender: yield* UserId.make('@example:example.org'),
            originServerTs: 2,
            unsigned: {
              redactedBecause: {
                type: 'm.room.message',
                content: {
                  body: 'grandchild',
                  format: 'org.matrix.custom.html',
                  formattedBody: '<b>grandchild</b>',
                  msgtype: 'm.text',
                },
                eventId: yield* EventId.make('$grandchild:example.org'),
                sender: yield* UserId.make('@example:example.org'),
                originServerTs: 3,
              },
            },
          },
        },
      })

      expect(output).toMatchObject({
        unsigned: {
          redactedBecause: {
            eventId: '$child:example.org',
            unsigned: {
              redactedBecause: {
                eventId: '$grandchild:example.org',
                content: {
                  body: 'grandchild',
                  format: 'org.matrix.custom.html',
                  formattedBody: '<b>grandchild</b>',
                  msgtype: 'm.text',
                },
              },
            },
          },
        },
      })
    }))
})

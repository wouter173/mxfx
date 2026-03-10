import { describe, expect, it } from '@effect/vitest'
import { Effect, Schema } from 'effect'

import { RoomId } from '../../../branded'
import { encodeSnakeCaseSchema } from '../../schema/encode-case'
import { getSyncV3ResponseSchema } from './get-sync-v3'

describe('getSyncV3ResponseSchema', () => {
  it.effect('decodes and encodes a full snake_case sync payload', () =>
    Effect.gen(function* () {
      const schema = getSyncV3ResponseSchema.pipe(encodeSnakeCaseSchema)

      const payload = {
        account_data: {
          events: [{ type: 'm.tag', content: { tags: { 'm.favourite': { order: 0.5 } } } }],
        },
        device_lists: { changed: ['@alice:example.org'], left: [] },
        device_one_time_keys_count: { signed_curve25519: 42 },
        next_batch: 's72595_4483_1934',
        presence: {
          events: [{ type: 'm.presence', sender: '@alice:example.org', content: { presence: 'online' } }],
        },
        rooms: {
          invite: {
            '!inviteroom:example.org': {
              invite_state: {
                events: [
                  {
                    type: 'm.room.member',
                    content: { membership: 'invite' },
                    sender: '@alice:example.org',
                    state_key: '@bob:example.org',
                  },
                ],
              },
            },
          },
          join: {
            '!joinedroom:example.org': {
              account_data: { events: [{ type: 'm.fully_read', content: { event_id: '$e1' } }] },
              ephemeral: {
                events: [{ type: 'm.typing', content: { user_ids: ['@alice:example.org'] } }],
              },
              state: {
                events: [
                  {
                    type: 'm.room.member',
                    content: { membership: 'join' },
                    event_id: '$state1',
                    origin_server_ts: 100,
                    sender: '@alice:example.org',
                    state_key: '@alice:example.org',
                    unsigned: {
                      age: 5,
                      membership: 'join',
                      prev_content: { membership: 'invite' },
                      transaction_id: 'tx-state',
                    },
                  },
                ],
              },
              summary: {
                'm.heroes': ['@alice:example.org', '@bob:example.org'],
                'm.invited_member_count': 1,
                'm.joined_member_count': 2,
              },
              timeline: {
                events: [
                  {
                    type: 'm.room.message',
                    content: {
                      msgtype: 'm.text',
                      body: 'hello',
                      format: 'org.matrix.custom.html',
                      formatted_body: '<b>hello</b>',
                    },
                    event_id: '$msg1',
                    origin_server_ts: 200,
                    sender: '@alice:example.org',
                    unsigned: {
                      age: 10,
                      membership: 'join',
                      prev_content: { body: 'old' },
                      transaction_id: 'tx-msg',
                      redacted_because: {
                        type: 'm.room.message',
                        content: {
                          msgtype: 'm.text',
                          body: 'redaction-root',
                          format: 'org.matrix.custom.html',
                          formatted_body: '<b>redaction-root</b>',
                        },
                        eventId: '$red1',
                        originServerTs: 201,
                        sender: '@alice:example.org',
                        unsigned: {
                          redactedBecause: {
                            type: 'm.room.message',
                            content: {
                              msgtype: 'm.text',
                              body: 'redaction-child',
                              format: 'org.matrix.custom.html',
                              formatted_body: '<b>redaction-child</b>',
                            },
                            eventId: '$red2',
                            originServerTs: 202,
                            sender: '@alice:example.org',
                          },
                        },
                      },
                    },
                  },
                ],
                limited: false,
                prev_batch: 't34-23535_0_0',
              },
              unread_notifications: {
                highlight_count: 2,
                notification_count: 7,
              },
              unread_thread_notifications: {
                $thread1: {
                  highlight_count: 1,
                  notification_count: 3,
                },
              },
            },
          },
          knock: {
            '!knockroom:example.org': {
              knock_state: {
                events: [
                  {
                    type: 'm.room.member',
                    content: { membership: 'knock' },
                    sender: '@charlie:example.org',
                    state_key: '@charlie:example.org',
                  },
                ],
              },
            },
          },
          leave: {
            '!leaveroom:example.org': {
              account_data: { events: [{ type: 'm.tag', content: { tags: {} } }] },
              state: {
                events: [
                  {
                    type: 'm.room.member',
                    content: { membership: 'leave' },
                    event_id: '$leave1',
                    origin_server_ts: 300,
                    sender: '@alice:example.org',
                  },
                ],
              },
              timeline: {
                events: [
                  {
                    type: 'm.room.message',
                    content: {
                      msgtype: 'm.notice',
                      body: 'bye',
                      format: 'org.matrix.custom.html',
                      formatted_body: '<i>bye</i>',
                    },
                    event_id: '$leave-msg',
                    origin_server_ts: 301,
                    sender: '@alice:example.org',
                  },
                ],
                limited: true,
                prev_batch: 't34-23535_1_0',
              },
            },
          },
        },
        to_device: {
          events: [
            {
              type: 'm.room_key',
              sender: '@alice:example.org',
              content: { algorithm: 'm.megolm.v1.aes-sha2' },
            },
          ],
        },
      }

      const decoded = yield* Schema.decodeUnknownEffect(schema)(payload)

      expect(decoded.nextBatch).toBe('s72595_4483_1934')
      expect(decoded.rooms?.join?.[yield* RoomId.make('!joinedroom:example.org')]?.timeline?.events?.[0]).toMatchObject({
        eventId: '$msg1',
        originServerTs: 200,
        unsigned: {
          prevContent: { body: 'old' },
          transactionId: 'tx-msg',
          redactedBecause: {
            eventId: '$red1',
            unsigned: {
              redactedBecause: {
                eventId: '$red2',
              },
            },
          },
        },
      })

      const encoded = Schema.encodeSync(schema)(decoded)

      expect(encoded).toStrictEqual(payload)
    }),
  )
})

import { describe, expect, it } from '@effect/vitest'
import { Effect } from 'effect'

import { RoomId } from '../../../branded/index.ts'
import { MatrixApi } from '../../matrix-api.ts'
import { makeMockMatrixApiLayer } from '../mock-api-layer.test.ts'
import { putRoomKeysV3 } from './put-room-keys-v3.ts'

const mockApiResponse = {
  count: 10,
  etag: 'abcdefg',
}

const mockApiRequest = {
  rooms: {
    '!room:example.org': {
      sessions: {
        sessionid1: {
          first_message_index: 1,
          forwarded_count: 0,
          is_verified: true,
          session_data: {
            ciphertext: 'base64+ciphertext+of+JSON+data',
            ephemeral: 'base64+ephemeral+key',
            mac: 'base64+mac+of+ciphertext',
          },
        },
      },
    },
  },
}

describe('post-keys-claim-v3', () => {
  it.effect('claims a one-time key', () =>
    Effect.gen(function* () {
      const api = yield* MatrixApi

      const room = yield* RoomId.make('!room:example.org')

      const result = yield* putRoomKeysV3({
        version: '1',
        body: {
          rooms: {
            [room]: {
              sessions: {
                sessionid1: {
                  firstMessageIndex: 1,
                  forwardedCount: 0,
                  isVerified: true,
                  sessionData: {
                    ciphertext: 'base64+ciphertext+of+JSON+data',
                    ephemeral: 'base64+ephemeral+key',
                    mac: 'base64+mac+of+ciphertext',
                  },
                },
              },
            },
          },
        },
      }).pipe(Effect.andThen(api.execute))

      expect(result).toStrictEqual({ count: 10, etag: 'abcdefg' })
    }).pipe(Effect.provide(makeMockMatrixApiLayer({ path: '/v3/room_keys/keys', response: mockApiResponse, request: mockApiRequest }))),
  )
})

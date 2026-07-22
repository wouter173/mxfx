import { describe, expect, it } from '@effect/vitest'
import { Effect } from 'effect'

import { UserId } from '../../../branded/index.ts'
import { MatrixApi } from '../../matrix-api.ts'
import { makeMockMatrixApiLayer } from '../mock-api-layer.test.ts'
import { postKeysClaimV3 } from './post-keys-claim-v3.ts'

const mockApiResponse = {
  one_time_keys: {
    '@alice:example.com': {
      JLAFKJWSCS: {
        'signed_curve25519:AAAAHg': {
          key: 'zKbLg+NrIjpnagy+pIY6uPL4ZwEG2v+8F9lmgsnlZzs',
          signatures: {
            '@alice:example.com': {
              'ed25519:JLAFKJWSCS': 'FLWxXqGbwrb8SM3Y795eB6OA8bwBcoMZFXBqnTn58AYWZSqiD45tlBVcDa2L7RwdKXebW/VzDlnfVJ+9jok1Bw',
            },
          },
        },
      },
    },
  },
}

const mockApiRequest = {
  one_time_keys: { '@alice:example.com': { JLAFKJWSCS: 'signed_curve25519' } },
  timeout: 10_000,
}

describe('post-keys-claim-v3', () => {
  it.effect('claims a one-time key', () =>
    Effect.gen(function* () {
      const api = yield* MatrixApi

      const alice = yield* UserId.make('@alice:example.com')
      const oneTimeKeys = { [alice]: { JLAFKJWSCS: 'signed_curve25519' } }

      const result = yield* postKeysClaimV3({ oneTimeKeys }).pipe(Effect.andThen(api.execute))

      expect(result).toStrictEqual({ oneTimeKeys })
    }).pipe(Effect.provide(makeMockMatrixApiLayer({ response: mockApiResponse, request: mockApiRequest }))),
  )
})

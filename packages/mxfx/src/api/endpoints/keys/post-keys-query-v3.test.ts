import { describe, expect, it } from '@effect/vitest'
import { Effect } from 'effect'

import { UserId } from '../../../branded/index.ts'
import { MatrixApi } from '../../matrix-api.ts'
import { makeMockMatrixApiLayer } from '../mock-api-layer.test.ts'
import { postKeysQueryV3 } from './post-keys-query-v3.ts'

const mockApiResponse = {
  device_keys: {
    '@alice:example.com': {
      JLAFKJWSCS: {
        algorithms: ['m.olm.v1.curve25519-aes-sha2', 'm.megolm.v1.aes-sha2'],
        device_id: 'JLAFKJWSCS',
        keys: {
          'curve25519:JLAFKJWSCS': '3C5BFWi2Y8MaVvjM8M22DBmh24PmgR0nPvJOIArzgyI',
          'ed25519:JLAFKJWSCS': 'lEuiRJBit0IG6nUf5pUzWTUEsRVVe/HJkoKuEww9ULI',
        },
        signatures: {
          '@alice:example.com': {
            'ed25519:JLAFKJWSCS': 'dSO80A01XiigH3uBiDVx/EjzaoycHcjq9lfQX0uWsqxl2giMIiSPR8a4d291W1ihKJL/a+myXS367WT6NAIcBA',
          },
        },
        unsigned: {
          device_display_name: "Alice's mobile phone",
        },
        user_id: '@alice:example.com',
      },
    },
  },
  master_keys: {
    '@alice:example.com': {
      keys: {
        'ed25519:base64+master+public+key': 'base64+master+public+key',
      },
      usage: ['master'],
      user_id: '@alice:example.com',
    },
  },
  self_signing_keys: {
    '@alice:example.com': {
      keys: {
        'ed25519:base64+self+signing+public+key': 'base64+self+signing+master+public+key',
      },
      signatures: {
        '@alice:example.com': {
          'ed25519:base64+master+public+key': 'signature+of+self+signing+key',
        },
      },
      usage: ['self_signing'],
      user_id: '@alice:example.com',
    },
  },
  user_signing_keys: {
    '@alice:example.com': {
      keys: {
        'ed25519:base64+user+signing+public+key': 'base64+user+signing+master+public+key',
      },
      signatures: {
        '@alice:example.com': {
          'ed25519:base64+master+public+key': 'signature+of+user+signing+key',
        },
      },
      usage: ['user_signing'],
      user_id: '@alice:example.com',
    },
  },
}

const mockApiRequest = {
  device_keys: {
    '@alice:example.com': [],
  },
  timeout: 10000,
}

describe('post-keys-claim-v3', () => {
  it.effect('claims a one-time key', () =>
    Effect.gen(function* () {
      const api = yield* MatrixApi

      const alice = yield* UserId.make('@alice:example.com')
      const deviceKeys = { [alice]: [] }

      const result = yield* postKeysQueryV3({ deviceKeys }).pipe(Effect.andThen(api.execute))

      expect(result.deviceKeys).toStrictEqual({
        [alice]: {
          JLAFKJWSCS: {
            algorithms: ['m.olm.v1.curve25519-aes-sha2', 'm.megolm.v1.aes-sha2'],
            deviceId: 'JLAFKJWSCS',
            keys: {
              'curve25519:JLAFKJWSCS': '3C5BFWi2Y8MaVvjM8M22DBmh24PmgR0nPvJOIArzgyI',
              'ed25519:JLAFKJWSCS': 'lEuiRJBit0IG6nUf5pUzWTUEsRVVe/HJkoKuEww9ULI',
            },
            signatures: {
              '@alice:example.com': {
                'ed25519:JLAFKJWSCS': 'dSO80A01XiigH3uBiDVx/EjzaoycHcjq9lfQX0uWsqxl2giMIiSPR8a4d291W1ihKJL/a+myXS367WT6NAIcBA',
              },
            },
            unsigned: { deviceDisplayName: "Alice's mobile phone" },
            userId: alice,
          },
        },
      })
    }).pipe(Effect.provide(makeMockMatrixApiLayer({ response: mockApiResponse, request: mockApiRequest }))),
  )
})

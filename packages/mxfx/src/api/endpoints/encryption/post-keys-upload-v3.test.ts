import { describe, expect, it } from '@effect/vitest'
import { Effect } from 'effect'

import { UserId } from '../../../branded/index.ts'
import { MatrixApi } from '../../matrix-api.ts'
import { makeMockMatrixApiLayer } from '../mock-api-layer.test.ts'
import { postKeysUploadV3 } from './post-keys-upload-v3.ts'

const mockApiResponse = {
  one_time_key_counts: {
    signed_curve25519: 20,
  },
}

const mockApiRequest = {
  device_keys: {
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
    user_id: '@alice:example.com',
  },
  fallback_keys: {
    'signed_curve25519:AAAAGj': {
      fallback: true,
      key: 'zKbLg+NrIjpnagy+pIY6uPL4ZwEG2v+8F9lmgsnlZzs',
      signatures: {
        '@alice:example.com': {
          'ed25519:JLAFKJWSCS': 'FLWxXqGbwrb8SM3Y795eB6OA8bwBcoMZFXBqnTn58AYWZSqiD45tlBVcDa2L7RwdKXebW/VzDlnfVJ+9jok1Bw',
        },
      },
    },
  },
  one_time_keys: {
    'signed_curve25519:AAAAHQ': {
      key: 'j3fR3HemM16M7CWhoI4Sk5ZsdmdfQHsKL1xuSft6MSw',
      signatures: {
        '@alice:example.com': {
          'ed25519:JLAFKJWSCS': 'IQeCEPb9HFk217cU9kw9EOiusC6kMIkoIRnbnfOh5Oc63S1ghgyjShBGpu34blQomoalCyXWyhaaT3MrLZYQAA',
        },
      },
    },
    'signed_curve25519:AAAAHg': {
      key: 'zKbLg+NrIjpnagy+pIY6uPL4ZwEG2v+8F9lmgsnlZzs',
      signatures: {
        '@alice:example.com': {
          'ed25519:JLAFKJWSCS': 'FLWxXqGbwrb8SM3Y795eB6OA8bwBcoMZFXBqnTn58AYWZSqiD45tlBVcDa2L7RwdKXebW/VzDlnfVJ+9jok1Bw',
        },
      },
    },
  },
}

describe('post-keys-upload-v3', () => {
  it.effect('upload a set of keys, string body', () =>
    Effect.gen(function* () {
      const api = yield* MatrixApi

      const result = yield* postKeysUploadV3(JSON.stringify(mockApiRequest)).pipe(Effect.andThen(api.executeRaw))

      expect(result).toStrictEqual(JSON.stringify(mockApiResponse))
    }).pipe(Effect.provide(makeMockMatrixApiLayer({ path: '/v3/keys/upload', response: mockApiResponse, request: mockApiRequest }))),
  )
  it.effect('upload a set of keys, typed body', () =>
    Effect.gen(function* () {
      const api = yield* MatrixApi

      const alice = yield* UserId.make('@alice:example.com')

      const result = yield* postKeysUploadV3({
        deviceKeys: {
          userId: alice,
          deviceId: 'JLAFKJWSCS',
          algorithms: ['m.olm.v1.curve25519-aes-sha2', 'm.megolm.v1.aes-sha2'],
          keys: {
            'curve25519:JLAFKJWSCS': '3C5BFWi2Y8MaVvjM8M22DBmh24PmgR0nPvJOIArzgyI',
            'ed25519:JLAFKJWSCS': 'lEuiRJBit0IG6nUf5pUzWTUEsRVVe/HJkoKuEww9ULI',
          },
          signatures: {
            [alice]: { 'ed25519:JLAFKJWSCS': 'dSO80A01XiigH3uBiDVx/EjzaoycHcjq9lfQX0uWsqxl2giMIiSPR8a4d291W1ihKJL/a+myXS367WT6NAIcBA' },
          },
        },
        fallbackKeys: {
          'signed_curve25519:AAAAGj': {
            fallback: true,
            key: 'zKbLg+NrIjpnagy+pIY6uPL4ZwEG2v+8F9lmgsnlZzs',
            signatures: {
              [alice]: { 'ed25519:JLAFKJWSCS': 'FLWxXqGbwrb8SM3Y795eB6OA8bwBcoMZFXBqnTn58AYWZSqiD45tlBVcDa2L7RwdKXebW/VzDlnfVJ+9jok1Bw' },
            },
          },
        },
        oneTimeKeys: {
          'signed_curve25519:AAAAHQ': {
            key: 'j3fR3HemM16M7CWhoI4Sk5ZsdmdfQHsKL1xuSft6MSw',
            signatures: {
              [alice]: { 'ed25519:JLAFKJWSCS': 'IQeCEPb9HFk217cU9kw9EOiusC6kMIkoIRnbnfOh5Oc63S1ghgyjShBGpu34blQomoalCyXWyhaaT3MrLZYQAA' },
            },
          },
          'signed_curve25519:AAAAHg': {
            key: 'zKbLg+NrIjpnagy+pIY6uPL4ZwEG2v+8F9lmgsnlZzs',
            signatures: {
              [alice]: { 'ed25519:JLAFKJWSCS': 'FLWxXqGbwrb8SM3Y795eB6OA8bwBcoMZFXBqnTn58AYWZSqiD45tlBVcDa2L7RwdKXebW/VzDlnfVJ+9jok1Bw' },
            },
          },
        },
      }).pipe(Effect.andThen(api.execute))

      expect(result).toStrictEqual({ oneTimeKeyCounts: { signed_curve25519: 20 } })
    }).pipe(Effect.provide(makeMockMatrixApiLayer({ path: '/v3/keys/upload', response: mockApiResponse, request: mockApiRequest }))),
  )
})

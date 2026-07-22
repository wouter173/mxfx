import { describe, expect, it } from '@effect/vitest'
import { Effect } from 'effect'

import { UserId } from '../../../branded/index.ts'
import { MatrixApi } from '../../matrix-api.ts'
import { makeMockMatrixApiLayer } from '../mock-api-layer.test.ts'
import { postKeysSignaturesUploadV3 } from './post-keys-signatures-upload-v3.ts'

const mockApiResponse = {
  failures: {
    '@alice:example.com': {
      HIJKLMN: {
        errcode: 'M_INVALID_SIGNATURE',
        error: 'Invalid signature',
      },
    },
  },
}

const mockApiRequest = {
  '@alice:example.com': {
    HIJKLMN: {
      algorithms: ['m.olm.v1.curve25519-aes-sha2', 'm.megolm.v1.aes-sha2'],
      device_id: 'HIJKLMN',
      keys: { 'curve25519:HIJKLMN': 'base64+curve25519+key', 'ed25519:HIJKLMN': 'base64+ed25519+key' },
      signatures: {
        '@alice:example.com': { 'ed25519:base64+self+signing+public+key': 'base64+signature+of+HIJKLMN' },
      },
      user_id: '@alice:example.com',
    },
    'base64+master+public+key': {
      keys: { 'ed25519:base64+master+public+key': 'base64+master+public+key' },
      signatures: {
        '@alice:example.com': { 'ed25519:HIJKLMN': 'base64+signature+of+master+key' },
      },
      usage: ['master'],
      user_id: '@alice:example.com',
    },
  },
  '@bob:example.com': {
    'bobs+base64+master+public+key': {
      keys: { 'ed25519:bobs+base64+master+public+key': 'bobs+base64+master+public+key' },
      signatures: {
        '@alice:example.com': { 'ed25519:base64+user+signing+public+key': 'base64+signature+of+bobs+master+key' },
      },
      usage: ['master'],
      user_id: '@bob:example.com',
    },
  },
}

describe('post-keys-signatures-upload-v3', () => {
  it.effect('upload a set of key signatures', () =>
    Effect.gen(function* () {
      const api = yield* MatrixApi

      const alice = yield* UserId.make('@alice:example.com')
      const bob = yield* UserId.make('@bob:example.com')

      const result = yield* postKeysSignaturesUploadV3({
        [alice]: {
          HIJKLMN: {
            userId: alice,
            deviceId: 'HIJKLMN',
            algorithms: ['m.olm.v1.curve25519-aes-sha2', 'm.megolm.v1.aes-sha2'],
            keys: { 'curve25519:HIJKLMN': 'base64+curve25519+key', 'ed25519:HIJKLMN': 'base64+ed25519+key' },
            signatures: { [alice]: { 'ed25519:base64+self+signing+public+key': 'base64+signature+of+HIJKLMN' } },
          },
          'base64+master+public+key': {
            userId: alice,
            usage: ['master'],
            keys: { 'ed25519:base64+master+public+key': 'base64+master+public+key' },
            signatures: { [alice]: { 'ed25519:HIJKLMN': 'base64+signature+of+master+key' } },
          },
        },
        [bob]: {
          'bobs+base64+master+public+key': {
            userId: bob,
            usage: ['master'],
            keys: { 'ed25519:bobs+base64+master+public+key': 'bobs+base64+master+public+key' },
            signatures: { [alice]: { 'ed25519:base64+user+signing+public+key': 'base64+signature+of+bobs+master+key' } },
          },
        },
      }).pipe(Effect.andThen(api.execute))

      expect(result).toStrictEqual({ failures: { [alice]: { HIJKLMN: { errcode: 'M_INVALID_SIGNATURE', error: 'Invalid signature' } } } })
    }).pipe(
      Effect.provide(makeMockMatrixApiLayer({ path: '/v3/keys/signatures/upload', response: mockApiResponse, request: mockApiRequest })),
    ),
  )
})

import { describe, expect, it } from '@effect/vitest'
import { Effect, Layer, Schema } from 'effect'
import { HttpClient, HttpClientResponse } from 'effect/unstable/http'

import { MatrixAuth } from '../../../auth/index.ts'
import { UserId } from '../../../branded/index.ts'
import { ServerName } from '../../../branded/server-name.ts'
import { MatrixConfig } from '../../../config/index.ts'
import { MatrixApi, layer as matrixApiLayer } from '../../matrix-api.ts'
import { postKeysClaimV3 } from './post-keys-claim-v3.ts'

const makeMockMatrixApiLayer = (response: unknown) => {
  const serverName = Schema.decodeSync(ServerName.schema)('example.com')
  const httpClient = HttpClient.make(request =>
    Effect.succeed(
      HttpClientResponse.fromWeb(
        request,
        new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    ),
  )

  return matrixApiLayer.pipe(
    Layer.provide([
      Layer.succeed(HttpClient.HttpClient, httpClient),
      Layer.succeed(MatrixConfig, {
        serverName,
        baseUrl: 'https://matrix.example.com',
      }),
      Layer.succeed(MatrixAuth, {
        getAccessToken: () => Effect.succeed({ token: 'test-access-token' }),
      }),
    ]),
  )
}

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

describe('post-keys-claim-v3', () => {
  it.effect('claims a one-time key', () =>
    Effect.gen(function* () {
      const alice = yield* UserId.make('@alice:example.com')
      const api = yield* MatrixApi

      const result = yield* postKeysClaimV3({
        oneTimeKeys: { [alice]: { JLAFKJWSCS: 'signed_curve25519' } },
        timeout: 10_000,
      }).pipe(Effect.andThen(api.execute))

      expect(result).toStrictEqual({
        oneTimeKeys: mockApiResponse.one_time_keys,
      })
    }).pipe(Effect.provide(makeMockMatrixApiLayer(mockApiResponse))),
  )
})

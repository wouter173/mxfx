import { describe, expect, it } from '@effect/vitest'
import { Effect } from 'effect'

import { UserId } from '../../../branded/index.ts'
import { MatrixApi } from '../../matrix-api.ts'
import { makeMockMatrixApiLayer } from '../mock-api-layer.test.ts'
import { putSendToDeviceV3 } from './put-send-to-device-v3.ts'

const mockApiResponse = {}
const mockApiRequest = { messages: { '@alice:example.com': { TLLBEANAAG: { example_content_key: 'value' } } } }

describe('put-send-to-device-v3', () => {
  it.effect('send-to-device', () =>
    Effect.gen(function* () {
      const api = yield* MatrixApi

      const alice = yield* UserId.make('@alice:example.com')

      const result = yield* putSendToDeviceV3({
        eventType: 'message-type',
        transactionId: 'transaction-id',
        body: { messages: { [alice]: { TLLBEANAAG: { example_content_key: 'value' } } } },
      }).pipe(Effect.andThen(api.execute))

      expect(result).toStrictEqual({})
    }).pipe(
      Effect.provide(
        makeMockMatrixApiLayer({
          path: '/v3/sendToDevice/message-type/transaction-id',
          response: mockApiResponse,
          request: mockApiRequest,
        }),
      ),
    ),
  )
})

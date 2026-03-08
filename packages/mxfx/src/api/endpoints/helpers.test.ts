import { describe, expect, test } from '@effect/vitest'
import { apiPath } from './helpers'
import { RoomId } from '../../branded'
import { Effect } from 'effect'

describe('MatrixEndpoint', () => {
  test('should create an endpoint with a branded path', () => {
    const p = apiPath()`/test/${'123'}`

    expect(p).toBe('/test/123')
  })

  test('should encode path parameters', () => {
    const p = apiPath()`/test/${'a b'}`

    expect(p).toBe('/test/a%20b')
  })

  test('should not encode path parameters when encode: false', () => {
    const p = apiPath({ encode: false })`/test/${'a b'}`

    expect(p).toBe('/test/a b')
  })

  test('should not encode path parameters when encode: false', () =>
    Effect.gen(function* () {
      const roomId = yield* RoomId.make('!test:example.com')
      const eventType = 'm.room.message'
      const transactionId = 'txn123'

      const p = apiPath()`/rooms/${roomId}/send/${eventType}/${transactionId}`

      expect(p).toBe('/test/a b')
    }))

  test('should not encode servername with discovery when encode: false', () => {
    const p = apiPath({ encode: false })`https://example.com/.well-known/matrix/client`

    expect(p).toBe('https://example.com/.well-known/matrix/client')
  })
})

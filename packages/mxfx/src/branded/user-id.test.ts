import { describe, expect, it } from '@effect/vitest'
import { Effect, Exit, Schema } from 'effect'

import { UserId } from './user-id.ts'

describe('branded', () => {
  it.effect('should be valid UserId', () =>
    Effect.gen(function* () {
      expect(yield* UserId.make('@wouter:matrix.org')).toBe('@wouter:matrix.org')
      expect(yield* UserId.make('@anotheruserid:example.com')).toBe('@anotheruserid:example.com')
      expect(yield* UserId.make('@anotheruserid:EXAMPLE.com')).toBe('@anotheruserid:EXAMPLE.com')
    }),
  )

  it.effect('should be invalid UserId', () =>
    Effect.gen(function* () {
      expect(Exit.isFailure(yield* Effect.exit(UserId.make('@:matrix.org')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(UserId.make('@userid:')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(UserId.make('userid:matrix.org')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(UserId.make('@userid')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(UserId.make('@CapitalizedUserId:MATRIX.org')))).toBeTruthy()

      const veryLongUserId = '@' + 'a'.repeat(244) + ':matrix.org'
      expect(Exit.isFailure(yield* Effect.exit(UserId.make(veryLongUserId)))).toBeTruthy()
    }),
  )

  it.effect('should decode historical UserIds received from a server', () =>
    Effect.gen(function* () {
      const decode = Schema.decodeUnknownEffect(UserId.schema)

      expect(yield* decode('@:matrix.org')).toBe('@:matrix.org')
      expect(yield* decode('@CapitalizedUserId:matrix.org')).toBe('@CapitalizedUserId:matrix.org')
      expect(yield* decode('@legacy~user:matrix.org')).toBe('@legacy~user:matrix.org')
      expect(yield* decode('@\u00e9:matrix.org')).toBe('@\u00e9:matrix.org')
      expect(yield* decode('@\ud83d\ude00:matrix.org')).toBe('@\ud83d\ude00:matrix.org')
    }),
  )

  it.effect('should reject invalid Unicode in historical UserIds', () =>
    Effect.gen(function* () {
      const decode = Schema.decodeUnknownEffect(UserId.schema)

      expect(Exit.isFailure(yield* Effect.exit(decode('@\ud800:matrix.org')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(decode('@\udfff:matrix.org')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(decode('@legacy\u0000user:matrix.org')))).toBeTruthy()
    }),
  )

  it.effect('should enforce the 255-byte UTF-8 limit for historical UserIds', () =>
    Effect.gen(function* () {
      const decode = Schema.decodeUnknownEffect(UserId.schema)
      const exactly255Bytes = `@${'\u00e9'.repeat(121)}a:matrix.org`
      const moreThan255Bytes = `@${'\u00e9'.repeat(122)}:matrix.org`

      expect(new TextEncoder().encode(exactly255Bytes).byteLength).toBe(255)
      expect(yield* decode(exactly255Bytes)).toBe(exactly255Bytes)
      expect(new TextEncoder().encode(moreThan255Bytes).byteLength).toBe(256)
      expect(Exit.isFailure(yield* Effect.exit(decode(moreThan255Bytes)))).toBeTruthy()
    }),
  )

  it.effect('should not create new UserIds using the historical grammar', () =>
    Effect.gen(function* () {
      expect(Exit.isFailure(yield* Effect.exit(UserId.make('@CapitalizedUserId:matrix.org')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(UserId.make('@legacy~user:matrix.org')))).toBeTruthy()
    }),
  )
})

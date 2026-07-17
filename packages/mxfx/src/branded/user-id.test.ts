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

      expect(yield* decode('@CapitalizedUserId:matrix.org')).toBe('@CapitalizedUserId:matrix.org')
      expect(yield* decode('@legacy~user:matrix.org')).toBe('@legacy~user:matrix.org')
    }),
  )

  it.effect('should not create new UserIds using the historical grammar', () =>
    Effect.gen(function* () {
      expect(Exit.isFailure(yield* Effect.exit(UserId.make('@CapitalizedUserId:matrix.org')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(UserId.make('@legacy~user:matrix.org')))).toBeTruthy()
    }),
  )
})

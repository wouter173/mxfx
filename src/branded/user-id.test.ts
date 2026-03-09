import { Effect, Exit } from 'effect'
import { UserId } from './user-id'

import { describe, expect, it } from '@effect/vitest'

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
})

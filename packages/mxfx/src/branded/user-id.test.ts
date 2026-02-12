import { Effect, Exit } from 'effect'
import { UserId } from './user-id'

import { describe, expect, it } from '@effect/vitest'

describe('branded', () => {
  it.effect('should be valid UserId', () =>
    Effect.gen(function* () {
      expect(yield* UserId.make('@wouter:matrix.org')).toBe('@wouter:matrix.org')
      expect(yield* UserId.make('@anotherroomid:example.com')).toBe('@anotherroomid:example.com')
    }),
  )

  it.effect('should be invalid UserId', () =>
    Effect.gen(function* () {
      expect(Exit.isFailure(yield* Effect.exit(UserId.make('@:matrix.org')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(UserId.make('@roomid:')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(UserId.make('roomid:matrix.org')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(UserId.make('@roomid')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(UserId.make('@CapitalizedUserId:matrix.org')))).toBeTruthy()
    }),
  )
})

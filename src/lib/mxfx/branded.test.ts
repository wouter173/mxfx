import { Effect, Exit } from 'effect'
import { RoomId, UserId } from './branded'

import { describe, expect, it } from '@effect/vitest'

describe('branded', () => {
  it.effect('should be valid RoomId', () =>
    Effect.gen(function* () {
      expect(yield* RoomId('!roomid:matrix.org')).toBe('!roomid:matrix.org')
      expect(yield* RoomId('!anotherRoomId:example.com')).toBe('!anotherRoomId:example.com')
    }),
  )

  it.effect('should be invalid RoomId', () =>
    Effect.gen(function* () {
      expect(Exit.isFailure(yield* Effect.exit(RoomId('!:matrix.org')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(RoomId('!roomid:')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(RoomId('roomid:matrix.org')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(RoomId('!roomid')))).toBeTruthy()
    }),
  )

  it.effect('should be valid UserId', () =>
    Effect.gen(function* () {
      expect(yield* UserId('@wouter:matrix.org')).toBe('@wouter:matrix.org')
      expect(yield* UserId('@anotherroomid:example.com')).toBe('@anotherroomid:example.com')
    }),
  )

  it.effect('should be invalid UserId', () =>
    Effect.gen(function* () {
      expect(Exit.isFailure(yield* Effect.exit(UserId('@:matrix.org')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(UserId('@roomid:')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(UserId('roomid:matrix.org')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(UserId('@roomid')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(UserId('@CapitalizedUserId:matrix.org')))).toBeTruthy()
    }),
  )
})

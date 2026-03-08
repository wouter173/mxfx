import { Effect, Exit } from 'effect'
import { RoomId } from './room-id'

import { describe, expect, it } from '@effect/vitest'

describe('branded', () => {
  it.effect('should be valid RoomId', () =>
    Effect.gen(function* () {
      expect(yield* RoomId.make('!roomid:matrix.org')).toBe('!roomid:matrix.org')
      expect(yield* RoomId.make('!anotherRoomId:example.com')).toBe('!anotherRoomId:example.com')
      expect(yield* RoomId.make('!dPxdtArDbghGKRocWe:maishond.nl')).toBe('!dPxdtArDbghGKRocWe:maishond.nl')
      // expect(yield* RoomId.make('!roomid')).toBe('!roomid')
    }),
  )

  it.effect('should be invalid RoomId', () =>
    Effect.gen(function* () {
      expect(Exit.isFailure(yield* Effect.exit(RoomId.make('!:matrix.org')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(RoomId.make('!roomid:')))).toBeTruthy()
      expect(Exit.isFailure(yield* Effect.exit(RoomId.make('roomid:matrix.org')))).toBeTruthy()
    }),
  )
})

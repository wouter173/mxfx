import { describe, expect, it } from '@effect/vitest'
import { Effect } from 'effect'

import { EventId } from './event-id'

const maxLengthWithServer = `$${'a'.repeat(243)}:matrix.org`
const tooLongWithServer = `$${'a'.repeat(244)}:matrix.org`
const maxLengthWithoutServer = `$${'a'.repeat(254)}`
const tooLongWithoutServer = `$${'a'.repeat(255)}`

describe('Valid EventIds', () => {
  it.live('$hello-world:matrix.org', () =>
    EventId.make('$hello-world:matrix.org').pipe(Effect.map(x => expect(x).toBe('$hello-world:matrix.org'))),
  )

  it.live('$hello_world:example.com', () =>
    EventId.make('$hello_world:example.com').pipe(Effect.map(x => expect(x).toBe('$hello_world:example.com'))),
  )

  it.live('$hello.world:example.com:8448', () =>
    EventId.make('$hello.world:example.com:8448').pipe(Effect.map(x => expect(x).toBe('$hello.world:example.com:8448'))),
  )

  it.live('$room:[1234:5678::abcd]', () =>
    EventId.make('$room:[1234:5678::abcd]').pipe(Effect.map(x => expect(x).toBe('$room:[1234:5678::abcd]'))),
  )

  it.live('$room:[1234:5678::abcd]:8448', () =>
    EventId.make('$room:[1234:5678::abcd]:8448').pipe(Effect.map(x => expect(x).toBe('$room:[1234:5678::abcd]:8448'))),
  )

  it.live('$opaque (no server)', () => EventId.make('$opaque').pipe(Effect.map(x => expect(x).toBe('$opaque'))))

  it.live('max length 255 with server', () => EventId.make(maxLengthWithServer).pipe(Effect.map(x => expect(x).toBe(maxLengthWithServer))))

  it.live('max length 255 without server', () =>
    EventId.make(maxLengthWithoutServer).pipe(Effect.map(x => expect(x).toBe(maxLengthWithoutServer))),
  )
})

describe('Invalid EventIds', () => {
  it.live.fails("''", () => EventId.make(''))
  it.live.fails("'#hello-world:matrix.org' (wrong sigil)", () => EventId.make('#hello-world:matrix.org'))
  it.live.fails("'$' (empty opaque id)", () => EventId.make('$'))
  it.live.fails("'$:matrix.org' (empty opaque id)", () => EventId.make('$:matrix.org'))
  it.live.fails("'$hello-world:' (empty server)", () => EventId.make('$hello-world:'))
  it.live.fails("'$hello-world:example.com:port' (invalid port)", () => EventId.make('$hello-world:example.com:port'))
  it.live.fails("'$room:[1234:5678::abcd]:port' (invalid ipv6 port)", () => EventId.make('$room:[1234:5678::abcd]:port'))
  it.live.fails("'$hello\u0000world:matrix.org' (null byte in opaque id)", () => EventId.make('$hello\u0000world:matrix.org'))
  it.live.fails('too long (>255) with server', () => EventId.make(tooLongWithServer))
  it.live.fails('too long (>255) without server', () => EventId.make(tooLongWithoutServer))
})

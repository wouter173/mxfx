import { Effect } from 'effect'
import { RoomAlias } from './room-alias'

import { describe, expect, it } from '@effect/vitest'

const maxLengthAlias = `#${'a'.repeat(243)}:matrix.org`
const tooLongAlias = `#${'a'.repeat(250)}:matrix.org`

describe('Valid RoomAliases', () => {
  it.live('#hello-world:matrix.org', () =>
    RoomAlias.make('#hello-world:matrix.org').pipe(Effect.map(x => expect(x).toBe('#hello-world:matrix.org'))),
  )

  it.live('#hello_world:example.com', () =>
    RoomAlias.make('#hello_world:example.com').pipe(Effect.map(x => expect(x).toBe('#hello_world:example.com'))),
  )

  it.live('#hello.world:example.com:8448', () =>
    RoomAlias.make('#hello.world:example.com:8448').pipe(Effect.map(x => expect(x).toBe('#hello.world:example.com:8448'))),
  )

  it.live('#room:[1234:5678::abcd]', () =>
    RoomAlias.make('#room:[1234:5678::abcd]').pipe(Effect.map(x => expect(x).toBe('#room:[1234:5678::abcd]'))),
  )

  it.live('#room:[1234:5678::abcd]:8448', () =>
    RoomAlias.make('#room:[1234:5678::abcd]:8448').pipe(Effect.map(x => expect(x).toBe('#room:[1234:5678::abcd]:8448'))),
  )

  it.live('max length 255', () => RoomAlias.make(maxLengthAlias).pipe(Effect.map(x => expect(x).toBe(maxLengthAlias))))
})

describe('Invalid RoomAliases', () => {
  it.live.fails("''", () => RoomAlias.make(''))
  it.live.fails("'#hello-world' (missing server)", () => RoomAlias.make('#hello-world'))
  it.live.fails("'#:matrix.org' (empty localpart)", () => RoomAlias.make('#:matrix.org'))
  it.live.fails("'#hello:world:matrix.org' (extra colon in localpart)", () => RoomAlias.make('#hello:world:matrix.org'))
  it.live.fails("'#hello-world:' (empty server)", () => RoomAlias.make('#hello-world:'))
  it.live.fails("'#hello-world:example.com:port' (invalid port)", () => RoomAlias.make('#hello-world:example.com:port'))
  it.live.fails("'#room:[1234:5678::abcd]:port' (invalid ipv6 port)", () => RoomAlias.make('#room:[1234:5678::abcd]:port'))
  it.live.fails('too long (>255)', () => RoomAlias.make(tooLongAlias))
})

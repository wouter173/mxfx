import { describe, expect, it } from '@effect/vitest'
import { Effect } from 'effect'

import { ServerName } from './server-name'

describe('Valid ServerNames', () => {
  it.live('matrix.org', () => ServerName.make('matrix.org').pipe(Effect.map(x => expect(x).toBe('matrix.org'))))
  it.live('example.com', () => ServerName.make('example.com').pipe(Effect.map(x => expect(x).toBe('example.com'))))
  it.live('example.com:8000', () => ServerName.make('example.com:8000').pipe(Effect.map(x => expect(x).toBe('example.com:8000'))))
  it.live('EXAMPLE.COM:8000', () => ServerName.make('EXAMPLE.COM:8000').pipe(Effect.map(x => expect(x).toBe('EXAMPLE.COM:8000'))))
  it.live('1.2.3.4:8000', () => ServerName.make('1.2.3.4:8000').pipe(Effect.map(x => expect(x).toBe('1.2.3.4:8000'))))
  it.live('1.2.3.4', () => ServerName.make('1.2.3.4').pipe(Effect.map(x => expect(x).toBe('1.2.3.4'))))
  it.live('[1234:5678::abcd]', () => ServerName.make('[1234:5678::abcd]').pipe(Effect.map(x => expect(x).toBe('[1234:5678::abcd]'))))
  it.live('[1234:5678::abcd]:5678', () =>
    ServerName.make('[1234:5678::abcd]:5678').pipe(Effect.map(x => expect(x).toBe('[1234:5678::abcd]:5678'))),
  )
})

describe('Invalid ServerNames', () => {
  it.live.fails("''", () => ServerName.make(''))
  it.live.fails("' '", () => ServerName.make(' '))
  it.live.fails(':', () => ServerName.make(':'))
  it.live.fails(':8000', () => ServerName.make(':8000'))
  it.live.fails('example.com:', () => ServerName.make('example.com:'))
  it.live.fails('example.com:port', () => ServerName.make('example.com:port'))
})

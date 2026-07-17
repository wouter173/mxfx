import { describe, expect, expectTypeOf, it } from '@effect/vitest'
import { Effect, Schema, Stream } from 'effect'

import { endpoints } from '../api/index.ts'
import { makeEvent } from './event.ts'

const commandContent = Schema.Struct({
  command: Schema.String,
  count: Schema.NumberFromString.pipe(Schema.check(Schema.isFinite())),
})

const commandEvent = makeEvent({
  type: 'com.example.command',
  bucket: 'rooms.joined',
  schema: commandContent,
  predicate: event => event.content.command === 'run',
})

const frame = Schema.decodeUnknownSync(endpoints.getSyncV3ResponseSchema)({
  nextBatch: 'next',
  rooms: {
    join: {
      '!room:example.org': {
        stateAfter: {
          events: [
            {
              type: 'com.example.command',
              content: { command: 'run', count: '1' },
              eventId: '$state:example.org',
              originServerTs: 1,
              sender: '@alice:example.org',
              stateKey: '',
            },
          ],
        },
        timeline: {
          events: [
            {
              type: 'com.example.command',
              content: { command: 'run', count: '2' },
              eventId: '$run:example.org',
              originServerTs: 2,
              sender: '@alice:example.org',
            },
            {
              type: 'com.example.command',
              content: { command: 'skip', count: '3' },
              eventId: '$skip:example.org',
              originServerTs: 3,
              sender: '@alice:example.org',
            },
            {
              type: 'com.example.command',
              content: { command: 'run', count: 'invalid' },
              eventId: '$invalid:example.org',
              originServerTs: 4,
              sender: '@alice:example.org',
            },
            {
              type: 'com.example.other',
              content: { command: 'run', count: '5' },
              eventId: '$other:example.org',
              originServerTs: 5,
              sender: '@alice:example.org',
            },
          ],
        },
      },
    },
  },
})

describe('makeEvent', () => {
  it.effect('selects, decodes, and refines events from joined rooms', () =>
    Effect.gen(function* () {
      const events = yield* Stream.make(frame).pipe(commandEvent.stream, Stream.runCollect)

      expect(Array.from(events)).toEqual([
        expect.objectContaining({
          roomId: '!room:example.org',
          type: 'com.example.command',
          stateKey: '',
          content: { command: 'run', count: 1 },
        }),
        expect.objectContaining({
          roomId: '!room:example.org',
          type: 'com.example.command',
          content: { command: 'run', count: 2 },
        }),
      ])
    }),
  )

  it('infers the literal event type and decoded content', () => {
    type Event = Parameters<typeof commandEvent.predicate>[0]
    expectTypeOf<Event['type']>().toEqualTypeOf<'com.example.command'>()
    expectTypeOf<Event['content']>().toEqualTypeOf<{
      readonly command: string
      readonly count: number
    }>()
  })

  it.effect('emits nothing when the joined-room bucket is absent', () =>
    Effect.gen(function* () {
      const emptyFrame = Schema.decodeUnknownSync(endpoints.getSyncV3ResponseSchema)({ nextBatch: 'next' })
      const events = yield* Stream.make(emptyFrame).pipe(commandEvent.stream, Stream.runCollect)

      expect(Array.from(events)).toEqual([])
    }),
  )
})

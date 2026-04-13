import { fileURLToPath } from 'node:url'

import { NodeFileSystem } from '@effect/platform-node'
import { LibsqlClient, LibsqlMigrator } from '@effect/sql-libsql'
import { expect, it } from '@effect/vitest'
import { Effect, Layer, Schema } from 'effect'
import { Statement } from 'effect/unstable/sql'

import { Common } from '../../api/schema'
import { EventId, RoomId, UserId } from '../../branded'
import * as Store from '../../store'
import { RoomRepository } from '../../store/repository/room-repository'
import { layerLibSQLLive } from '../index'

const libSqlLive = LibsqlClient.layer({
  url: 'file::memory:?cache=shared',
})
const sqlLoggerLive = Layer.succeed(Statement.CurrentTransformer)(statement => {
  const [query, params] = statement.compile()
  return Effect.log('executing sql').pipe(Effect.annotateLogs({ query, params }), Effect.as(statement))
})
const migrationsPath = fileURLToPath(new URL('../migrations', import.meta.url))

const layerLive = layerLibSQLLive.pipe(
  Layer.provideMerge(libSqlLive),
  Layer.provideMerge(NodeFileSystem.layer),
  Layer.provideMerge(sqlLoggerLive),
)

const runMigrations = LibsqlMigrator.run({
  loader: LibsqlMigrator.fromFileSystem(migrationsPath),
  schemaDirectory: migrationsPath,
  table: 'migrations',
})

it.live(
  'room timeline',

  Effect.fn(
    function* () {
      yield* runMigrations

      const roomRepo = yield* RoomRepository
      const roomId = yield* RoomId.make('!room-id')
      const eventId = yield* EventId.make('$event-id')
      const sender = yield* UserId.make('@user-id:example.org')

      const event = yield* Schema.decodeEffect(Common.RoomEvent)({
        content: { msgtype: 'm.text', body: 'Hello, world!' },
        eventId,
        sender,
        originServerTs: 1756992882735,
        type: 'm.room.message',
      })

      yield* roomRepo.appendEvent({ roomId, event })

      const timeline1 = yield* roomRepo.getTimeline({ roomId, amount: 10 })
      yield* Effect.log({ timeline1 })

      // simulate redact logic on event
      yield* Effect.gen(function* () {
        const redactionEventId = yield* EventId.make('$redaction-event-id')
        const redactionEvent = yield* Schema.decodeEffect(Common.RoomEvent)({
          content: { reason: 'No reason', redacts: eventId },
          eventId: redactionEventId,
          sender,
          originServerTs: 1756992882735,
          type: 'm.room.redaction',
        })

        yield* roomRepo.appendEvent({ roomId, event: { ...redactionEvent } })

        const redactedEvent = { ...event, content: {} }
        yield* roomRepo.updateEvent({ eventId, event: redactedEvent })
      }).pipe(Store.transactional)

      const timeline2 = yield* roomRepo.getTimeline({ roomId, amount: 10 })
      yield* Effect.log({ timeline2 })
    },
    Store.transactional,
    Effect.provide(layerLive),
  ),
)

it.live(
  'nested tx savepoint semantics',

  Effect.fn(function* () {
    yield* runMigrations

    const roomRepo = yield* RoomRepository
    const roomId = yield* RoomId.make('!room-id-nested')
    const sender = yield* UserId.make('@user-id:example.org')

    const outerEvent1Id = yield* EventId.make('$outer-event-1')
    const innerEventId = yield* EventId.make('$inner-event')
    const outerEvent2Id = yield* EventId.make('$outer-event-2')

    yield* Effect.gen(function* () {
      const outerEvent1 = yield* Schema.decodeEffect(Common.RoomEvent)({
        content: { msgtype: 'm.text', body: 'outer-1' },
        eventId: outerEvent1Id,
        sender,
        originServerTs: 1756992882735,
        type: 'm.room.message',
      })
      yield* roomRepo.appendEvent({ roomId, event: outerEvent1 })

      yield* Effect.gen(function* () {
        const innerEvent = yield* Schema.decodeEffect(Common.RoomEvent)({
          content: { msgtype: 'm.text', body: 'inner' },
          eventId: innerEventId,
          sender,
          originServerTs: 1756992882735,
          type: 'm.room.message',
        })
        yield* roomRepo.appendEvent({ roomId, event: innerEvent })
        yield* Effect.fail('force inner rollback')
      }).pipe(Store.transactional, Effect.catch(Effect.logError))

      const outerEvent2 = yield* Schema.decodeEffect(Common.RoomEvent)({
        content: { msgtype: 'm.text', body: 'outer-2' },
        eventId: outerEvent2Id,
        sender,
        originServerTs: 1756992882735,
        type: 'm.room.message',
      })
      yield* roomRepo.appendEvent({ roomId, event: outerEvent2 })
    }).pipe(Store.transactional)

    const timeline = yield* roomRepo.getTimeline({ roomId, amount: 10 })
    const timelineEventIds = timeline.map(event => event.eventId)

    expect(timelineEventIds).toContain(outerEvent1Id)
    expect(timelineEventIds).toContain(outerEvent2Id)
    expect(timeline.some(event => event.eventId === innerEventId)).toBe(false)
    expect(timelineEventIds).toHaveLength(2)
  }, Effect.provide(layerLive)),
)

it.live(
  'room state picks latest by state_key and originServerTs',

  Effect.fn(function* () {
    yield* runMigrations

    const roomRepo = yield* RoomRepository
    const roomId = yield* RoomId.make('!room-id-state')
    const sender = yield* UserId.make('@user-id:example.org')

    const oldTopicEventId = yield* EventId.make('$old-topic-event')
    const newTopicEventId = yield* EventId.make('$new-topic-event')
    const otherStateEventId = yield* EventId.make('$other-state-event')
    const messageEventId = yield* EventId.make('$message-event')

    const oldTopicEvent = yield* Schema.decodeEffect(Common.RoomEvent)({
      type: 'm.room.topic',
      content: { topic: 'old topic' },
      eventId: oldTopicEventId,
      originServerTs: 100,
      sender,
      stateKey: '',
    })

    const newTopicEvent = yield* Schema.decodeEffect(Common.RoomEvent)({
      type: 'm.room.topic',
      content: { topic: 'new topic' },
      eventId: newTopicEventId,
      originServerTs: 200,
      sender,
      stateKey: '',
    })

    const otherStateEvent = yield* Schema.decodeEffect(Common.RoomEvent)({
      type: 'm.room.topic',
      content: { topic: 'other state key' },
      eventId: otherStateEventId,
      originServerTs: 150,
      sender,
      stateKey: 'other',
    })

    const messageEvent = yield* Schema.decodeEffect(Common.RoomEvent)({
      type: 'm.room.message',
      content: { msgtype: 'm.text', body: 'not a state event' },
      eventId: messageEventId,
      originServerTs: 300,
      sender,
    })

    yield* roomRepo.appendEvent({ roomId, event: oldTopicEvent })
    yield* roomRepo.appendEvent({ roomId, event: otherStateEvent })
    yield* roomRepo.appendEvent({ roomId, event: newTopicEvent })
    yield* roomRepo.appendEvent({ roomId, event: messageEvent })

    const state = yield* roomRepo.getState({ roomId })
    const stateEventIds = state.map(event => event.eventId)

    expect(stateEventIds).toContain(newTopicEventId)
    expect(stateEventIds).toContain(otherStateEventId)
    expect(stateEventIds).not.toContain(oldTopicEventId)
    expect(stateEventIds).not.toContain(messageEventId)
    expect(stateEventIds).toHaveLength(2)

    yield* Effect.log({ state })
  }, Effect.provide(layerLive)),
)

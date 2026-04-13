import { Effect, Layer, Schema } from 'effect'
import { SqlClient } from 'effect/unstable/sql'

import { Common } from '../../api/schema'
import type { EventId, RoomId } from '../../branded'
import { DecodingError, StoreError } from '../../store/error'
import { RoomRepository } from '../../store/repository/room-repository'

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  return {
    appendEvent: Effect.fnUntraced(function* ({ roomId, event }: { roomId: RoomId; event: Common.ClientEventWithoutRoomId }) {
      const raw = yield* Schema.encodeEffect(Common.ClientEventWithoutRoomId)(event).pipe(
        Effect.mapError(err => new DecodingError({ cause: err, message: 'Failed to encode event for room timeline' })),
        Effect.mapError(err => new StoreError({ reason: err })),
      )

      yield* sql`
        INSERT INTO room_events(room_id, event_id, raw)
        VALUES (${roomId}, ${event.eventId}, ${JSON.stringify(raw)})
      `.pipe(Effect.mapError(err => new StoreError({ reason: err, message: 'Failed to append event to room timeline' })))
    }),

    updateEvent: Effect.fnUntraced(function* ({ eventId, event }: { eventId: EventId; event: Common.ClientEventWithoutRoomId }) {
      const raw = yield* Schema.encodeEffect(Common.ClientEventWithoutRoomId)(event).pipe(
        Effect.mapError(err => new DecodingError({ cause: err, message: 'Failed to encode event for room timeline' })),
        Effect.mapError(err => new StoreError({ reason: err })),
      )

      yield* sql`
        UPDATE room_events
        SET raw = ${JSON.stringify(raw)}, updated_at = CURRENT_TIMESTAMP
        WHERE event_id = ${eventId}
      `.pipe(Effect.mapError(err => new StoreError({ reason: err, message: 'Failed to update event in room timeline' })))
    }),

    getTimeline: Effect.fnUntraced(function* ({ roomId, amount }: { roomId: RoomId; amount: number }) {
      const res = yield* sql`
        SELECT raw
        FROM room_events
        WHERE room_id = ${roomId}
        ORDER BY created_at DESC
        LIMIT ${amount}
      `.pipe(Effect.mapError(err => new StoreError({ reason: err, message: 'Failed to get room timeline events' })))

      const events = yield* Schema.decodeUnknownEffect(Schema.Array(Schema.Struct({ raw: Schema.fromJsonString(Common.RoomEvent) })))(
        res,
      ).pipe(
        Effect.mapError(err => new DecodingError({ cause: err, message: 'Failed to decode room timeline events' })),
        Effect.mapError(err => new StoreError({ reason: err })),
      )

      return events.map(e => e.raw)
    }),

    getState: Effect.fnUntraced(function* ({ roomId }: { roomId: RoomId }) {
      const res = yield* sql`
        SELECT raw
        FROM (
          SELECT raw, ROW_NUMBER()
          OVER (
            PARTITION BY state_key ORDER BY CAST(
              json_extract(raw, '$.originServerTs') AS INTEGER
            ) DESC, created_at DESC
          ) AS row_num
          FROM room_events
          WHERE room_id = ${roomId} AND state_key IS NOT NULL
        )
        WHERE row_num = 1
        ORDER BY CAST(json_extract(raw, '$.originServerTs') AS INTEGER) DESC
      `.pipe(Effect.mapError(err => new StoreError({ reason: err, message: 'Failed to get room state events' })))

      const events = yield* Schema.decodeUnknownEffect(Schema.Array(Schema.Struct({ raw: Schema.fromJsonString(Common.RoomEvent) })))(
        res,
      ).pipe(
        Effect.mapError(err => new DecodingError({ cause: err, message: 'Failed to decode room state events' })),
        Effect.mapError(err => new StoreError({ reason: err })),
      )

      return events.map(e => e.raw)
    }),
  }
})

export const roomTimelineRepositoryLibSQLLive = Layer.effect(RoomRepository, make)

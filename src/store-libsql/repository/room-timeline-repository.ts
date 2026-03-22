import { Effect, Layer } from 'effect'
import { SqlClient, SqlResolver } from 'effect/unstable/sql'

import { ClientEventWithoutRoomId } from '../../api/schema/common'
import type { EventId, RoomId } from '../../branded'
import { RoomTimelineRepository } from '../../store/repository/room-timeline-repository'
import type { SyncResponse } from '../../store/types'

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  return {
    append: Effect.fnUntraced(
      (roomId: RoomId, event: Event) => sql`
      INSERT INTO room_events (room_id, event_id, event_data)
      VALUES (${roomId}, ${event.event_id}, ${JSON.stringify(event)})
    `,
    ),
    redact: (roomId: RoomId, eventId: EventId) => Effect.Effect<void>,
    getTimeline: (roomId: RoomId, amount: number) => Effect.Effect<Event[]>,
  }
})

export const roomTimelineRepositoryLibSQLLive = Layer.effect(RoomTimelineRepository, make)

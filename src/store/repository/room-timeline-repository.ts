import { Effect, ServiceMap } from 'effect'

import type { EventId, RoomId } from '../../branded'
import type { SyncResponse } from '../types'

type Event = NonNullable<NonNullable<NonNullable<NonNullable<SyncResponse['rooms']>['join']>[RoomId]['timeline']>['events']>[number]

export class RoomTimelineRepository extends ServiceMap.Service<
  RoomTimelineRepository,
  {
    append: (roomId: RoomId, event: Event) => Effect.Effect<void>
    redact: (roomId: RoomId, eventId: EventId) => Effect.Effect<void>
    getTimeline: (roomId: RoomId, amount: number) => Effect.Effect<Event[]>
  }
>()('mxfx/store/RoomTimelineRepository') {}

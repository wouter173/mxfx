import { Effect, ServiceMap } from 'effect'

import type { RoomEvent } from '../../api/schema/common'
import type { EventId, RoomId } from '../../branded'
import type { StoreError } from '../error'

type RoomEvent = typeof RoomEvent.Type

export class RoomRepository extends ServiceMap.Service<
  RoomRepository,
  {
    appendEvent: ({ roomId, event }: { roomId: RoomId; event: RoomEvent }) => Effect.Effect<void, StoreError>
    updateEvent: ({ eventId, event }: { eventId: EventId; event: RoomEvent }) => Effect.Effect<void, StoreError>
    getTimeline: ({ roomId, amount }: { roomId: RoomId; amount: number }) => Effect.Effect<RoomEvent[], StoreError>
    getState: ({ roomId }: { roomId: RoomId }) => Effect.Effect<RoomEvent[], StoreError>
  }
>()('mxfx/store/RoomRepository') {}

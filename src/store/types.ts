import type { getSyncV3ResponseSchema } from '../api/endpoints/sync/get-sync-v3'

type Values<T> = T[keyof T]

export type SyncResponse = typeof getSyncV3ResponseSchema.Type

export type SyncRooms = NonNullable<SyncResponse['rooms']>
export type JoinedRooms = NonNullable<SyncRooms['join']>
export type JoinedRoomSync = Values<JoinedRooms>
export type RoomSummary = NonNullable<JoinedRoomSync['summary']>
export type RoomState = NonNullable<JoinedRoomSync['state']>
export type RoomStateEvent = RoomState['events'][number]
export type RoomTimeline = NonNullable<JoinedRoomSync['timeline']>
export type RoomTimelineEvent = NonNullable<RoomTimeline['events']>[number]

import { EventId, RoomId } from '../../../branded/index.ts'
import { roomEvent } from '../../../schema/event.ts'
import { makeEndpoint } from '../endpoint.ts'
import * as RequestOptions from '../request-options.ts'

const schema = roomEvent

/**
 * `GET /_matrix/client/v3/rooms/{roomId}/event/{eventId}`
 *
 * @description
 * Get a single event based on roomId/eventId. You must have permission to retrieve this event e.g. by being a member in the room for
 * this event.
 *
 * @see https://spec.matrix.org/v1.17/client-server-api/#get_matrixclientv3roomsroomideventeventid
 */
export const getRoomsEventV3 = ({ roomId, eventId }: { roomId: RoomId; eventId: EventId }) => {
  return makeEndpoint('GET', { auth: true, schema })`/v3/rooms/${RequestOptions.path(RoomId.schema, roomId)}/event/${RequestOptions.path(
    EventId.schema,
    eventId,
  )}`
}

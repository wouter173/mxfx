import type { EventId, RoomId } from '../../../branded'
import { RoomEvent } from '../../schema/common'
import { makeEndpoint } from '../helpers'

const schema = RoomEvent

/**
 * `GET /_matrix/client/v3/rooms/{roomId}/events/{eventId}`
 *
 * @description
 * Get a single event based on roomId/eventId. You must have permission to retrieve this event e.g. by being a member in the room for
 * this event.
 *
 * @see https://spec.matrix.org/v1.17/client-server-api/#get_matrixclientv3roomsroomideventeventid
 */
export const getRoomsEvent = ({ roomId, eventId }: { roomId: RoomId; eventId: EventId }) => {
  return makeEndpoint('GET', { auth: true, schema })`/v3/rooms/${roomId}/events/${eventId}`
}

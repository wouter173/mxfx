import { Schema } from 'effect'

import { RoomId } from '../../../branded/room-id'
import { apiPath, makeEndpoint } from '../helpers'

const responseSchema = Schema.Struct({
  roomId: RoomId.schema,
})

/**
 * `POST /_matrix/client/v3/rooms/{roomId}/join`
 *
 * Note that this API requires a room ID, not alias. /join/{roomIdOrAlias} exists if you have a room alias.
 *
 * @description
 * This API starts a user’s participation in a particular room, if that user is allowed to participate in that room. After this call, the
 * client is allowed to see all current state events in the room, and all subsequent events associated with the room until the user leaves
 * the room.
 *
 * @see https://spec.matrix.org/v1.17/client-server-api/#post_matrixclientv3roomsroomidjoin
 */
export const postRoomsJoinV3 = ({ roomId }: { roomId: RoomId }) =>
  makeEndpoint({
    path: apiPath()`/v3/rooms/${roomId}/join`,
    method: 'POST',
    auth: true,
    schema: responseSchema,
  })

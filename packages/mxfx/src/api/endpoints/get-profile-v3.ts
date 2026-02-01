import { Schema } from 'effect'
import { makeEndpoint } from '../matrix-endpoint'
import { MxcUriSchema } from '../../branded'

const responseSchema = Schema.Struct({
  avatarUrl: Schema.optional(MxcUriSchema).pipe(Schema.fromKey('avatar_url')),
  displayname: Schema.optional(Schema.String),
  //TODO: Make versioned fields
  'm.tz': Schema.optional(Schema.String),
  //TODO: Also support custom fields
})

/**
 * `GET /_matrix/client/v3/profile/{userId}`
 *
 * Get the combined profile information for this user. This API may be used to fetch the user’s own profile information or other users;
 * either locally or on remote homeservers.
 *
 * @category Endpoints
 * @see https://spec.matrix.org/v1.17/client-server-api/#get_matrixclientv3profileuserid
 */
export const getProfileV3 = ({ userId }: { userId: string }) =>
  makeEndpoint({
    path: `/v3/profile/${encodeURIComponent(userId)}`,
    method: 'GET',
    auth: true,
    schema: responseSchema,
  })

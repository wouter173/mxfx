import { Schema } from 'effect'

import { MxcUri } from '../../../branded/mxc-uri'
import { UserId } from '../../../branded/user-id'
import { apiPath, makeEndpoint } from '../helpers'

const responseSchema = Schema.Struct({
  avatarUrl: Schema.optional(Schema.NullOr(MxcUri.schema)),
  displayname: Schema.optional(Schema.String),
  //TODO: Make versioned fields
  'm.tz': Schema.optional(Schema.String),
  //TODO: Also support custom fields
})

/**
 * `GET /_matrix/client/v3/profile/{userId}`
 *
 * @description
 * Get the combined profile information for this user. This API may be used to fetch the user’s own profile information or other users;
 * either locally or on remote homeservers.
 *
 * @see https://spec.matrix.org/v1.17/client-server-api/#get_matrixclientv3profileuserid
 */
export const getProfileV3 = ({ userId }: { userId: UserId }) =>
  makeEndpoint({
    path: apiPath()`/v3/profile/${userId}`,
    method: 'GET',
    auth: true,
    schema: responseSchema,
  })

/*
 * TODO: explore this pattern:
 * The idea is to have the endpoints be branded or tagged so they can only be used with the correct client.
 * This is especially useful for discovery endpoints that that live outside the api.
 */
// apiEndpoint({method: 'GET', schema})`/v3/profile/${userId}`

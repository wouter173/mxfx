import { Schema } from 'effect'

import { UserId } from '../../../branded/index.ts'
import { makeEndpoint } from '../endpoint.ts'

const schema = Schema.Struct({
  userId: UserId.schema,
  deviceId: Schema.optional(Schema.String), // Device ID associated with the access token. If no device is associated with the access token (such as in the case of application services) then this field can be omitted. Otherwise this is required.
  isGuest: Schema.optional(Schema.Boolean), // When true, the user is a Guest User. When not present or false, the user is presumed to be a non-guest user.
})

/**
 * `GET /_matrix/client/account/whoami`
 *
 * @description
 * Gets information about the owner of a given access token.
 *
 * Note that, as with the rest of the Client-Server API, Application Services may masquerade as users within their namespace by
 * giving a user_id query parameter. In this situation, the server should verify that the given user_id is registered by the
 * appservice, and return it in the response body.
 *
 * @see documentationUrl
 */
export const getAccountWhoami = () => makeEndpoint('GET', { auth: true, schema: schema })`/v3/account/whoami`

import { Schema } from 'effect'

import { MxcUri } from '../../../branded/index.ts'
import { makeEndpoint } from '../endpoint.ts'
import * as RequestOptions from '../request-options.ts'

const optionsSchema = Schema.Struct({
  limit: Schema.optional(Schema.Int),
  searchTerm: Schema.String,
})

const userResponseSchema = Schema.Struct({
  avatarUrl: Schema.OptionFromNullishOr(MxcUri.schema),
  displayName: Schema.OptionFromNullishOr(Schema.String),
  userId: Schema.String,
})

const schema = Schema.Struct({
  limited: Schema.Boolean,
  results: Schema.Array(userResponseSchema),
})

/**
 * `POST /_matrix/client/v3/user_directory/search `
 *
 * @description
 * Performs a search for users. The homeserver may determine which subset of users are searched. However, the homeserver MUST at a minimum
 * consider users who are visible to the requester based on their membership in rooms known to the homeserver.
 *
 * @see https://spec.matrix.org/v1.17/client-server-api/#post_matrixclientv3user_directorysearch
 */
export const postUserDirectorySearchV3 = (options: Schema.Schema.Type<typeof optionsSchema>) =>
  makeEndpoint('POST', { auth: true, body: RequestOptions.body(optionsSchema, options), schema })`/v3/user_directory/search`

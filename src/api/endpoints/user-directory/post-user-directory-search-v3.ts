import { Effect, Schema } from 'effect'

import { apiPath, makeEndpoint } from '../helpers'
import { HttpBody } from 'effect/unstable/http'
import { MxcUri } from '../../../branded/mxc-uri'
import { encodeSnakeCaseSchema } from '../../schema/encode-case'

const optionsSchema = Schema.Struct({
  limit: Schema.optional(Schema.Int),
  searchTerm: Schema.String,
})

const userResponseSchema = Schema.Struct({
  avatarUrl: Schema.OptionFromNullishOr(MxcUri.schema),
  displayName: Schema.OptionFromNullishOr(Schema.String),
  userId: Schema.String,
})

const responseSchema = Schema.Struct({
  limited: Schema.Boolean,
  results: Schema.Array(userResponseSchema),
})

/**
 * `POST /_matrix/client/v3/user_directory/search `
 *
 * Performs a search for users. The homeserver may determine which subset of users are searched. However, the homeserver MUST at a minimum
 * consider users who are visible to the requester based on their membership in rooms known to the homeserver.
 *
 * @category Endpoints
 * @see https://spec.matrix.org/v1.17/client-server-api/#post_matrixclientv3user_directorysearch
 */
export const postUserDirectorySearchV3 = (options: Schema.Schema.Type<typeof optionsSchema>) =>
  Effect.gen(function* () {
    const body = yield* Schema.encodeEffect(optionsSchema.pipe(encodeSnakeCaseSchema))(options).pipe(Effect.andThen(HttpBody.json))

    return yield* makeEndpoint({
      auth: true,
      method: 'POST',
      path: apiPath()`/v3/user_directory/search`,
      body,
      schema: responseSchema,
    })
  })

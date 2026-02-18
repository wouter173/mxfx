import { Effect, Schema } from 'effect'
import { nullable } from '../../schema/transform'
import { makeEndpoint } from '../../matrix-endpoint'
import { HttpBody } from '@effect/platform'
import { MxcUri } from '../../../branded/mxc-uri'

const optionsSchema = Schema.Struct({
  limit: Schema.optional(Schema.Number.pipe(Schema.int())),
  searchTerm: Schema.propertySignature(Schema.String).pipe(Schema.fromKey('search_term')),
})

const userResponseSchema = Schema.Struct({
  avatarUrl: Schema.optional(nullable(MxcUri.schema)).pipe(Schema.fromKey('avatar_url')),
  displayName: Schema.optional(nullable(Schema.String)).pipe(Schema.fromKey('display_name')),
  userId: Schema.propertySignature(Schema.String).pipe(Schema.fromKey('user_id')),
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
    const body = yield* Schema.encode(optionsSchema)(options).pipe(Effect.andThen(HttpBody.json))

    return yield* makeEndpoint({
      auth: true,
      method: 'POST',
      path: '/v3/user_directory/search',
      body,
      schema: responseSchema,
    })
  })

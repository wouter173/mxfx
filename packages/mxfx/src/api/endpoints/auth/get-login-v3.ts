import { Effect, Schema } from 'effect'
import { makeEndpoint } from '../../matrix-endpoint'

const responseSchema = Schema.Struct({
  flows: Schema.Array(Schema.Struct({ type: Schema.String })),
})

/**
 * `GET /_matrix/client/v3/login`
 *
 * Gets the homeserver’s supported login types to authenticate users. Clients should pick one of these and supply it as the type when
 * logging in.
 *
 * @category Endpoints
 * @see https://spec.matrix.org/v1.17/client-server-api/#get_matrixclientv3login
 */
export const getLoginV3 = () =>
  makeEndpoint({
    path: '/v3/login',
    method: 'GET',
    auth: false,
    schema: responseSchema,
  })

import { Schema } from 'effect'

import type { ServerName } from '../../../branded/server-name'
import { apiPath, makeEndpoint } from '../helpers'

const responseSchema = Schema.Struct({
  'm.homeserver': Schema.Struct({
    baseUrl: Schema.String,
  }),
})

/**
 * `GET /.well-known/matrix/client`
 *
 * Gets discovery information about the domain. The file may include additional keys, which MUST follow the Java package naming convention,
 * e.g. com.example.myapp.property.
 *
 * @see https://spec.matrix.org/v1.17/client-server-api/#getwell-knownmatrixclient
 */
export const getWellKnown = ({ serverName }: { serverName: ServerName }) =>
  makeEndpoint({
    path: apiPath({ encode: false })`https://${serverName}/.well-known/matrix/client`,
    method: 'GET',
    auth: false,
    schema: responseSchema,
  })

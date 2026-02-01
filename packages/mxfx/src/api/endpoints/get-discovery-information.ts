import { Schema } from 'effect'
import { makeEndpoint } from '../matrix-endpoint'

const responseSchema = Schema.Struct({
  'm.homeserver': Schema.Struct({
    baseUrl: Schema.propertySignature(Schema.String).pipe(Schema.fromKey('base_url')),
  }),
})

/**
 * `GET /.well-known/matrix/client`
 *
 * Gets discovery information about the domain. The file may include additional keys, which MUST follow the Java package naming convention,
 * e.g. com.example.myapp.property.
 *
 * @category Endpoints
 * @see https://spec.matrix.org/v1.17/client-server-api/#getwell-knownmatrixclient
 */
export const getDiscoveryInformation = ({ serverName }: { serverName: string }) =>
  makeEndpoint({
    path: `https://${serverName}/.well-known/matrix/client`,
    method: 'GET',
    auth: false,
    schema: responseSchema,
  })

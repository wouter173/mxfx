import { expect } from '@effect/vitest'
import { Effect, Layer, Schema } from 'effect'
import { HttpClient, HttpClientResponse } from 'effect/unstable/http'

import { ServerName } from '../../branded/server-name.ts'
import { MatrixApi, MatrixConfig, MatrixAuth } from '../../index.ts'

export const makeMockMatrixApiLayer = ({
  path,
  response,
  request: expectedRequest,
}: {
  path?: string
  response: unknown
  request: unknown
}) => {
  const res = new Response(JSON.stringify(response), { status: 200, headers: { 'content-type': 'application/json' } })

  const serverName = Schema.decodeSync(ServerName.schema)('example.com')
  const httpClient = HttpClient.make((request, url) =>
    Effect.sync(() => {
      expect(url.pathname).toBe(`/_matrix/client${path}`)

      if (request.body._tag !== 'Uint8Array') throw new Error('Expected a JSON request body')

      expect(JSON.parse(new TextDecoder().decode(request.body.body))).toStrictEqual(expectedRequest)

      return HttpClientResponse.fromWeb(request, res)
    }),
  )

  return MatrixApi.layer.pipe(
    Layer.provide([
      Layer.succeed(HttpClient.HttpClient, httpClient),
      Layer.succeed(MatrixConfig.MatrixConfig, { serverName, baseUrl: 'https://matrix.example.com' }),
      Layer.succeed(MatrixAuth.MatrixAuth, { getAccessToken: () => Effect.succeed({ token: 'test-access-token' }) }),
    ]),
  )
}

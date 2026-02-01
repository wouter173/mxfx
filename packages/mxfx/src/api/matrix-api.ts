import { Effect } from 'effect'
import { ApiHttpClient, AuthHttpClient } from './http-client'
import { makeHttpRequest, parseHttpResponse, type MatrixEndpoint } from './matrix-endpoint'

export class MatrixApi extends Effect.Service<MatrixApi>()('mxfxMatrixApi', {
  effect: Effect.gen(function* () {
    const authHttpClient = yield* AuthHttpClient
    const apiHttpClient = yield* ApiHttpClient

    return {
      execute: <A, I, R>(endpoint: MatrixEndpoint<A, I, R>) =>
        Effect.gen(function* () {
          const client = endpoint.auth ? authHttpClient : apiHttpClient
          const request = yield* makeHttpRequest(endpoint)
          return yield* client.execute(request).pipe(Effect.andThen(parseHttpResponse(endpoint)))
        }),
    }
  }),
  dependencies: [AuthHttpClient.Default, ApiHttpClient.Default],
}) {}

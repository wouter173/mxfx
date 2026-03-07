import { Effect, Layer, ServiceMap } from 'effect'
import { ApiHttpClient, AuthHttpClient } from './http-client'
import { makeHttpRequest, parseHttpResponse, type MatrixEndpoint } from './matrix-endpoint'

const make = Effect.gen(function* () {
  const authHttpClient = yield* AuthHttpClient.AuthHttpClient
  const apiHttpClient = yield* ApiHttpClient.ApiHttpClient

  return {
    execute: <A>(endpoint: MatrixEndpoint<A>) =>
      Effect.gen(function* () {
        const client = endpoint.auth ? authHttpClient : apiHttpClient
        const request = yield* makeHttpRequest(endpoint)
        return yield* client.execute(request).pipe(Effect.andThen(parseHttpResponse(endpoint)))
      }),
  }
})

export class MatrixApi extends ServiceMap.Service<MatrixApi>()('mxfxMatrixApi', { make }) {}
export const layer = Layer.effect(MatrixApi, make).pipe(Layer.provide(ApiHttpClient.layer), Layer.provide(AuthHttpClient.layer))

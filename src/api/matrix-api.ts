import { Effect, Layer, ServiceMap } from 'effect'
import type { Schema } from 'effect'

import { makeHttpRequest, parseHttpResponse, type MatrixEndpoint } from './endpoints/helpers'
import { ApiHttpClient, AuthHttpClient } from './http-client'

const make = Effect.gen(function* () {
  const authHttpClient = yield* AuthHttpClient.AuthHttpClient
  const apiHttpClient = yield* ApiHttpClient.ApiHttpClient

  return {
    execute: <S extends Schema.Top>(endpoint: MatrixEndpoint<S>) =>
      Effect.gen(function* () {
        const client = endpoint.auth ? authHttpClient : apiHttpClient
        const request = yield* makeHttpRequest(endpoint)
        return yield* client.execute(request).pipe(Effect.andThen(parseHttpResponse(endpoint)))
      }),
  }
})

export class MatrixApi extends ServiceMap.Service<MatrixApi>()('mxfxMatrixApi', { make }) {}
export const layer = Layer.effect(MatrixApi, make).pipe(
  // Layer.provideMerge(BaseHttpClient.layer),
  Layer.provideMerge(ApiHttpClient.layer),
  Layer.provideMerge(AuthHttpClient.layer),
)

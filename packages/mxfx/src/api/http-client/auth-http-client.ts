import { Effect, Layer, Context } from 'effect'
import { HttpClientRequest } from 'effect/unstable/http'
import { mapRequestEffect } from 'effect/unstable/http/HttpClient'

import { MatrixAuth } from '../../auth/index.ts'
import { ApiHttpClient } from './index.ts'
import { withLogging } from './logging.ts'

const make = Effect.gen(function* () {
  const apiHttpClient = yield* ApiHttpClient.ApiHttpClient
  const matrixAuth = yield* MatrixAuth

  return apiHttpClient.pipe(
    mapRequestEffect(req =>
      matrixAuth.getAccessToken().pipe(Effect.andThen(({ token }) => Effect.succeed(HttpClientRequest.bearerToken(req, token)))),
    ),
  )
})

const makeWithLogging = make.pipe(Effect.map(withLogging))
export class AuthHttpClient extends Context.Service<AuthHttpClient>()('mxfx/AuthHttpClient', { make: makeWithLogging }) {}

export const layer = Layer.effect(AuthHttpClient, makeWithLogging).pipe(Layer.provide(ApiHttpClient.layerWithoutLogging))
export const layerWithoutLogging = Layer.effect(AuthHttpClient, make).pipe(Layer.provide(ApiHttpClient.layerWithoutLogging))

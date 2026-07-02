import { Effect, Layer, Context } from 'effect'
import { HttpClientRequest } from 'effect/unstable/http'
import { mapRequest } from 'effect/unstable/http/HttpClient'

import { MatrixConfig } from '../../config/index.ts'
import { BaseHttpClient } from './index.ts'
import { withLogging } from './logging.ts'

const make = Effect.gen(function* () {
  const baseHttpClient = yield* BaseHttpClient.BaseHttpClient
  const matrixConfig = yield* MatrixConfig

  return baseHttpClient.pipe(mapRequest(HttpClientRequest.prependUrl(`${matrixConfig.baseUrl ?? ''}/_matrix/client`)))
})

const makeWithLogging = make.pipe(Effect.map(withLogging))
export class ApiHttpClient extends Context.Service<ApiHttpClient>()('mxfx/ApiHttpClient', { make: makeWithLogging }) {}

export const layer = Layer.effect(ApiHttpClient, makeWithLogging).pipe(Layer.provide(BaseHttpClient.layerWithoutLogging))
export const layerWithoutLogging = Layer.effect(ApiHttpClient, make).pipe(Layer.provide(BaseHttpClient.layerWithoutLogging))

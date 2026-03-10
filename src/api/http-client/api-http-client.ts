import { Effect, Layer, ServiceMap } from 'effect'
import { HttpClientRequest } from 'effect/unstable/http'
import { mapRequest } from 'effect/unstable/http/HttpClient'

import { BaseHttpClient } from '.'
import { MatrixConfig } from '../../config'

const make = Effect.gen(function* () {
  const baseHttpClient = yield* BaseHttpClient.BaseHttpClient
  const matrixConfig = yield* MatrixConfig.MatrixConfig

  yield* Effect.logDebug(`Using Matrix base URL: ${matrixConfig.baseUrl}`)
  return baseHttpClient.pipe(mapRequest(HttpClientRequest.prependUrl(`${matrixConfig.baseUrl ?? ''}/_matrix/client`)))
})

export class ApiHttpClient extends ServiceMap.Service<ApiHttpClient>()('mxfx/ApiHttpClient', {
  make,
}) {}

export const layer = Layer.effect(ApiHttpClient, make).pipe(Layer.provide(BaseHttpClient.layer))

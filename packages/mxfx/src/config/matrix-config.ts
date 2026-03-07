import { Config, Effect, Layer, ServiceMap } from 'effect'
import { getDiscoveryInformation } from '../api/endpoints/discovery/get-well-known'
import { BaseHttpClient } from '../api/http-client/base-http-client'
import { makeHttpRequest, parseHttpResponse } from '../api/matrix-endpoint'

type MatrixConfigService = {
  serverName: string
  baseUrl: string
}

export class MatrixConfig extends ServiceMap.Service<MatrixConfig, MatrixConfigService>()('mxfx/MatrixConfig') {}

export const make = ({ serverName }: MakeOpts) =>
  Effect.gen(function* () {
    yield* Effect.logDebug(`Creating MatrixConfig for server: ${serverName}`)
    const baseHttpClient = yield* BaseHttpClient

    const endpoint = yield* getDiscoveryInformation({ serverName })

    const request = yield* makeHttpRequest(endpoint)
    const res = yield* baseHttpClient.execute(request).pipe(Effect.andThen(parseHttpResponse(endpoint)))

    return { serverName, baseUrl: res['m.homeserver'].baseUrl }
  })

type MakeOpts = {
  serverName: string
}

export const layer = (opts: MakeOpts) => Layer.effect(MatrixConfig, make(opts))
export const layerConfig = (optsConfig: Config.Wrap<MakeOpts>) =>
  Layer.effect(MatrixConfig, Effect.andThen(Config.unwrap(optsConfig).asEffect(), make))

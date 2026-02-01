import { Config, Effect, Layer } from 'effect'
import { getDiscoveryInformation } from '../api/endpoints/get-discovery-information'
import { BaseHttpClient } from '../api/http-client'
import { makeHttpRequest, parseHttpResponse } from '../api/matrix-endpoint'

type MatrixConfigService = {
  serverName: string
  baseUrl: string
}

export class MatrixConfig extends Effect.Tag('mxfx/MatrixConfig')<MatrixConfig, MatrixConfigService>() {}

export const make = ({ serverName }: MakeOpts) =>
  Effect.gen(function* () {
    yield* Effect.logDebug(`Creating MatrixConfig for server: ${serverName}`)
    const baseHttpClient = yield* BaseHttpClient

    const endpoint = getDiscoveryInformation({ serverName })

    const request = yield* makeHttpRequest(endpoint)
    const res = yield* baseHttpClient.execute(request).pipe(Effect.andThen(parseHttpResponse(endpoint)))

    return { serverName, baseUrl: res['m.homeserver'].baseUrl }
  }).pipe(Effect.provide(BaseHttpClient.Default))

type MakeOpts = {
  serverName: string
}

export const layer = (opts: MakeOpts) => Layer.effect(MatrixConfig, make(opts))
export const layerConfig = (_: Config.Config.Wrap<MakeOpts>) => Layer.effect(MatrixConfig, Effect.flatMap(Config.unwrap(_), make))

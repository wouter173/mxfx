import { HttpClient, HttpClientResponse } from '@effect/platform'
import { Config, Effect, Layer, Schema } from 'effect'

type MatrixConfigService = {
  serverName: string
  baseUrl: string
}

export class MatrixConfig extends Effect.Tag('mxfx/MatrixConfig')<MatrixConfig, MatrixConfigService>() {}

export const DiscoveryInformationResponseSchema = Schema.Struct({
  'm.homeserver': Schema.Struct({ base_url: Schema.String }),
})

export const make = ({ serverName }: MakeOpts) =>
  Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient

    yield* Effect.logDebug(`Creating MatrixConfig for server: ${serverName}`)

    const res = yield* httpClient
      .get(`https://${serverName}/.well-known/matrix/client`)
      .pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(DiscoveryInformationResponseSchema)))

    return { serverName, baseUrl: res['m.homeserver'].base_url }
  })

type MakeOpts = {
  serverName: string
}

export const layer = (opts: MakeOpts) => Layer.effect(MatrixConfig, make(opts))
export const layerConfig = (_: Config.Config.Wrap<MakeOpts>) => Layer.effect(MatrixConfig, Effect.flatMap(Config.unwrap(_), make))

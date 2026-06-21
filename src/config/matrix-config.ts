import { Config, Effect, Layer, Schema, Context } from 'effect'

import { getWellKnown } from '../api/endpoints/discovery/get-well-known'
import { makeHttpRequest, parseHttpResponse } from '../api/endpoints/endpoint'
import { BaseHttpClient } from '../api/http-client'
import { ServerName } from '../branded/server-name'

const MatrixConfigSchema = Schema.Struct({
  serverName: ServerName.schema,
  baseUrl: Schema.String,
})

export class MatrixConfig extends Context.Service<MatrixConfig, typeof MatrixConfigSchema.Type>()('mxfx/MatrixConfig') {}

export const makeConfig = (opts: MakeOpts) =>
  Effect.gen(function* () {
    const baseHttpClient = yield* BaseHttpClient.BaseHttpClient

    const serverName = yield* ServerName.make(opts.serverName)
    const endpoint = yield* getWellKnown({ serverName })

    const request = yield* makeHttpRequest(endpoint)
    const res = yield* baseHttpClient.execute(request).pipe(Effect.andThen(parseHttpResponse(endpoint)))

    return { serverName, baseUrl: res['m.homeserver'].baseUrl }
  })

type MakeOpts = {
  serverName: string
}

export const layer = (opts: MakeOpts) => Layer.effect(MatrixConfig, makeConfig(opts)).pipe(Layer.provide(BaseHttpClient.layer))
export const layerConfig = (optsConfig: Config.Wrap<MakeOpts>) =>
  Layer.effect(MatrixConfig, Config.unwrap(optsConfig).pipe(Effect.andThen(makeConfig))).pipe(Layer.provide(BaseHttpClient.layer))

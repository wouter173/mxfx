import { Config, Effect, Layer, Schema, ServiceMap } from 'effect'

import { getWellKnown } from '../api/endpoints/discovery/get-well-known'
import { makeHttpRequest, parseHttpResponse } from '../api/endpoints/helpers'
import * as BaseHttpClient from '../api/http-client/base-http-client'
import { ServerName } from '../branded/server-name'

const MatrixConfigSchema = Schema.Struct({
  serverName: ServerName.schema,
  baseUrl: Schema.String,
})

export class MatrixConfig extends ServiceMap.Service<MatrixConfig, typeof MatrixConfigSchema.Type>()('mxfx/MatrixConfig') {}

export const make = (opts: MakeOpts) =>
  Effect.gen(function* () {
    const serverName = yield* ServerName.makeEffect(opts.serverName)

    yield* Effect.logDebug(`Creating MatrixConfig for server: ${serverName}`)
    const baseHttpClient = yield* BaseHttpClient.BaseHttpClient

    const endpoint = yield* getWellKnown({ serverName })

    const request = yield* makeHttpRequest(endpoint)
    const res = yield* baseHttpClient.execute(request).pipe(Effect.andThen(parseHttpResponse(endpoint)))

    return { serverName, baseUrl: res['m.homeserver'].baseUrl }
  })

type MakeOpts = {
  serverName: string
}

export const layer = (opts: MakeOpts) => Layer.effect(MatrixConfig, make(opts)).pipe(Layer.provide(BaseHttpClient.layer))
export const layerConfig = (optsConfig: Config.Wrap<MakeOpts>) =>
  Layer.effect(MatrixConfig, Config.unwrap(optsConfig).asEffect().pipe(Effect.andThen(make))).pipe(Layer.provide(BaseHttpClient.layer))

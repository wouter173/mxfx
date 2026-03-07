import { Effect, Layer, ServiceMap, Option } from 'effect'
import { mapRequestEffect } from 'effect/unstable/http/HttpClient'
import { ApiHttpClient } from '.'
import { Vault } from '../../vault'
import { HttpClientRequest } from 'effect/unstable/http'

const make = Effect.gen(function* () {
  const apiHttpClient = yield* ApiHttpClient.ApiHttpClient
  const vault = yield* Vault

  return apiHttpClient.pipe(
    mapRequestEffect(req =>
      vault.getItem('accessToken').pipe(
        Effect.andThen(Effect.fromOption),
        Effect.catchTag('NoSuchElementError', () => Effect.fail(new Error('No access token found in vault'))), //TODO: create proper error type
        Effect.andThen(token => Effect.succeed(HttpClientRequest.bearerToken(req, token))),
      ),
    ),
  )
})

export class AuthHttpClient extends ServiceMap.Service<AuthHttpClient>()('mxfx/AuthHttpClient', { make }) {}
export const layer = Layer.effect(AuthHttpClient, make).pipe(Layer.provide(ApiHttpClient.layer))

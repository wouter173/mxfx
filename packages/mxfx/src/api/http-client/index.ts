import { HttpBody, HttpClient, HttpClientRequest, UrlParams } from '@effect/platform'
import { Effect, Either, Option, Schema } from 'effect'
import { ApiHttpError } from '../error'
import { MatrixApiErrorContentSchema } from '../schema/error'
import { MatrixConfig } from '../../config/matrix-config'
import { mapRequest, mapRequestEffect } from '@effect/platform/HttpClient'
import { Vault } from '../../vault'

export class BaseHttpClient extends Effect.Service<BaseHttpClient>()('mxfx/BaseHttpClient', {
  effect: Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient

    return httpClient.pipe(
      HttpClient.tapRequest(req =>
        Effect.logDebug(
          `Matrix API Request: ${req.method} ${Either.getOrNull(UrlParams.makeUrl(req.url, req.urlParams, req.hash))}`,
          req.body,
        ),
      ),
      HttpClient.filterOrElse(
        res => res.status >= 200 && res.status < 400,
        res =>
          res.text.pipe(
            Effect.andThen(Schema.decodeUnknown(Schema.parseJson(MatrixApiErrorContentSchema))),
            Effect.catchAll(err =>
              Effect.logError(`Failed to decode MatrixApiErrorContent: ${err}`).pipe(
                Effect.as({ errcode: 'M_UNKNOWN' as const, error: 'Unknown error' }),
              ),
            ),
            Effect.andThen(
              content =>
                new ApiHttpError({ method: res.request.method, url: res.request.url, body: res.request.body, status: res.status, content }),
            ),
            Effect.andThen(Effect.fail),
          ),
      ),
    )
  }),
}) {}

export class ApiHttpClient extends Effect.Service<ApiHttpClient>()('mxfx/ApiHttpClient', {
  effect: Effect.gen(function* () {
    const baseHttpClient = yield* BaseHttpClient
    const matrixConfig = yield* MatrixConfig

    yield* Effect.logDebug(`Using Matrix base URL: ${matrixConfig.baseUrl}`)
    return baseHttpClient.pipe(mapRequest(HttpClientRequest.prependUrl(`${matrixConfig.baseUrl ?? ''}/_matrix/client`)))
  }),
  dependencies: [BaseHttpClient.Default],
}) {}

export class AuthHttpClient extends Effect.Service<AuthHttpClient>()('mxfx/AuthHttpClient', {
  effect: Effect.gen(function* () {
    const apiHttpClient = yield* ApiHttpClient
    const vault = yield* Vault

    return apiHttpClient.pipe(
      mapRequestEffect(req =>
        vault.getItem('accessToken').pipe(
          Effect.flatten,
          Effect.mapError(() => new Error('No access token found in vault')),
          Effect.andThen(token => HttpClientRequest.bearerToken(req, token)),
        ),
      ),
    )
  }),
  dependencies: [ApiHttpClient.Default],
}) {}

import { HttpClient, UrlParams } from 'effect/unstable/http'
import { Effect, Layer, Result, Schema, ServiceMap } from 'effect'
import { ApiHttpError } from '../error'
import { MatrixApiErrorContentSchema } from '../schema/error'

const make = Effect.gen(function* () {
  const httpClient = yield* HttpClient.HttpClient

  return httpClient.pipe(
    HttpClient.tapRequest(req =>
      Effect.logDebug(
        `Matrix API Request: ${req.method} ${Result.getOrElse(UrlParams.makeUrl(req.url, req.urlParams, req.hash), () => '')}`,
        req.body,
      ),
    ),
    HttpClient.filterOrElse(
      res => res.status >= 200 && res.status < 400,
      res =>
        res.text.pipe(
          Effect.andThen(Schema.decodeUnknownEffect(MatrixApiErrorContentSchema)),
          Effect.catch(err =>
            Effect.logError(`Failed to decode MatrixApiErrorContent: ${err}`).pipe(
              Effect.as({ errcode: 'M_UNKNOWN' as const, error: 'Unknown error' }),
            ),
          ),
          Effect.andThen(content =>
            Effect.succeed(
              new ApiHttpError({
                method: res.request.method,
                params: res.request.urlParams,
                url: res.request.url,
                body: res.request.body,
                status: res.status,
                content,
              }),
            ),
          ),
          Effect.andThen(Effect.fail),
        ),
    ),
  )
})

export class BaseHttpClient extends ServiceMap.Service<BaseHttpClient>()('mxfx/BaseHttpClient', { make }) {}
export const layer = Layer.effect(BaseHttpClient, make)

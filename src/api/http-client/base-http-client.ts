import { Effect, Layer, Schema, Context } from 'effect'
import { HttpClient } from 'effect/unstable/http'

import { ApiHttpError } from '../error'
import { MatrixApiErrorContentSchema } from '../schema/error'
import { withLogging } from './logging'

const make = Effect.gen(function* () {
  const httpClient = yield* HttpClient.HttpClient

  return httpClient.pipe(
    HttpClient.filterOrElse(
      res => res.status >= 200 && res.status < 400,
      res =>
        res.json.pipe(
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

const makeWithLogging = make.pipe(Effect.map(withLogging))
export class BaseHttpClient extends Context.Service<BaseHttpClient>()('mxfx/BaseHttpClient', { make: makeWithLogging }) {}

export const layer = Layer.effect(BaseHttpClient, makeWithLogging)
export const layerWithoutLogging = Layer.effect(BaseHttpClient, make)

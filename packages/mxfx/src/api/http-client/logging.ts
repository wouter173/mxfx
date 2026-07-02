import { Effect, Result } from 'effect'
import { HttpClient, UrlParams } from 'effect/unstable/http'

export const withLogging = <E, R>(httpClient: HttpClient.HttpClient.With<E, R>): HttpClient.HttpClient.With<E, R> =>
  httpClient.pipe(
    HttpClient.tapRequest(req =>
      Effect.logDebug(
        `[API] => ${req.method} ${Result.getOrElse(UrlParams.makeUrl(req.url, req.urlParams, req.hash.valueOrUndefined), () => '')}`,
        req.body,
      ),
    ),
    HttpClient.tap(res =>
      Effect.logDebug(
        `[API] <= ${res.request.method} ${Result.getOrElse(UrlParams.makeUrl(res.request.url, res.request.urlParams, res.request.hash.valueOrUndefined), () => '')} ${res.status}`,
      ),
    ),
  )

import { HttpClient, HttpClientRequest, UrlParams } from '@effect/platform'
import { Effect, Either, Schema } from 'effect'
import { MatrixClientSessionStore } from '../client/matrix-client-session-store'
import { ApiHttpError } from './error'
import { MatrixApiErrorContentSchema } from './schema/error'
import { MatrixConfig } from '../config/matrix-config'

export class MatrixHttpClient extends Effect.Service<MatrixHttpClient>()('mxfx/MatrixHttpClient', {
  effect: Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient
    const sessionStore = yield* MatrixClientSessionStore
    const matrixConfig = yield* MatrixConfig

    const matrixHttpClient = httpClient.pipe(
      HttpClient.tapRequest(req =>
        Effect.logDebug(`Matrix API Request: ${req.method} ${Either.getOrNull(UrlParams.makeUrl(req.url, req.urlParams, req.hash))}`),
      ),
      HttpClient.filterOrElse(
        res => res.status >= 200 && res.status < 400,
        res =>
          res.text
            .pipe(
              Effect.flatMap(text =>
                Effect.gen(function* () {
                  const content = Schema.decodeUnknownEither(Schema.parseJson(MatrixApiErrorContentSchema))(text)
                  if (Either.isLeft(content)) {
                    yield* Effect.logError(`Failed to decode MatrixApiErrorContent from response body: ${text}`)
                    return { errcode: 'M_UNKNOWN' as 'M_UNKNOWN', error: 'Unknown error' }
                  }
                  return content.right
                }),
              ),
              Effect.map(
                content =>
                  new ApiHttpError({
                    method: res.request.method,
                    url: res.request.url,
                    body: res.request.body,
                    status: res.status,
                    content,
                  }),
              ),
              Effect.orElse(() =>
                Effect.succeed(
                  new ApiHttpError({ method: res.request.method, url: res.request.url, body: res.request.body, status: res.status }),
                ),
              ),
            )
            .pipe(Effect.flatMap(Effect.fail)),
      ),
    )

    const setMatrixBaseUrl = (req: HttpClientRequest.HttpClientRequest) =>
      Effect.gen(function* () {
        yield* Effect.logDebug(`Using Matrix base URL: ${matrixConfig.baseUrl}`)
        return req.pipe(HttpClientRequest.prependUrl(`${matrixConfig.baseUrl ?? ''}/_matrix/client`))
      })

    const setAuthToken = (req: HttpClientRequest.HttpClientRequest) =>
      Effect.gen(function* () {
        const session = yield* sessionStore.get()
        yield* Effect.logDebug(`Using auth token: ${session?.credentials.token}`)
        return req.pipe(HttpClientRequest.bearerToken(session?.credentials.token ?? ''))
      })

    return { client: matrixHttpClient.pipe(HttpClient.mapRequestEffect(setMatrixBaseUrl)), setAuthToken }
  }),
  dependencies: [MatrixClientSessionStore.Default],
}) {}

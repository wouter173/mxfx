import { Effect } from 'effect'
import { Service } from 'effect/Effect'
import { MatrixApi } from '../api/matrix-api'

export class MatrixAuth extends Service<MatrixAuth>()('mxfx/MatrixAuth', {
  effect: Effect.gen(function* () {
    const matrixApi = yield* MatrixApi

    return {
      make: Effect.succeed({
        // getValidHomeServerUrl: (homeServerUrl: string) =>
        //   Effect.gen(function* () {
        //     const baseUrl = yield* matrixApi.wellKnown.get(homeServerUrl).pipe(
        //       Effect.map((res) => res['m.homeserver'].base_url),
        //       Effect.tapError(() => Effect.logWarning(`No valid .well-known found at ${homeServerUrl}, using as-is`)),
        //       Effect.catchAll(() => Effect.succeed(homeServerUrl)),
        //     )
        //     return baseUrl
        //   }),
      }),
    }
  }),
  dependencies: [MatrixApi.Default],
}) {}

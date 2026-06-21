import { Config, Effect, Layer } from 'effect'

import { MatrixAuth } from './auth'

export const layerLegacyConfig = (
  optsConfig: Config.Wrap<{
    accessToken: string
  }>,
) =>
  Layer.effect(
    MatrixAuth,
    Config.unwrap(optsConfig).pipe(
      Effect.andThen(({ accessToken }) => Effect.succeed({ getAccessToken: () => Effect.succeed({ token: accessToken }) })),
    ),
  )

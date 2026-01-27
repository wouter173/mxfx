import { Effect, Config } from 'effect'

import { NodeRuntime } from '@effect/platform-node'
import { NodeHttpClient } from '@effect/platform-node'
import { MatrixConfig } from 'mxfx'
import { MatrixApi } from 'mxfx/api'
import { InMemoryVault } from 'mxfx/vault'
import { getLoginV3 } from 'mxfx/api/endpoints'

const program = Effect.gen(function* () {
  const matrixUserName = yield* Config.string('MATRIX_USER_NAME')
  const matrixUserPassword = yield* Config.redacted('MATRIX_USER_PASSWORD')

  const config = yield* MatrixConfig.MatrixConfig
  yield* Effect.log({ matrixUserName, matrixUserPassword, matrixBaseUrl: config.baseUrl })

  const api = yield* MatrixApi
  const x = yield* api.request(getLoginV3)
  yield* Effect.log({ x: JSON.stringify(x) })
})

NodeRuntime.runMain(
  program.pipe(
    Effect.provide(MatrixApi.Default),
    Effect.provide(MatrixConfig.layerConfig({ serverName: Config.string('MATRIX_HOME_SERVER') })),
    Effect.provide(InMemoryVault),
    Effect.provide(NodeHttpClient.layer),
  ),
)

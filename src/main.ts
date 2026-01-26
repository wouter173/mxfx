import { Effect, Layer, pipe, Config } from 'effect'

import { NodeRuntime } from '@effect/platform-node'
import { NodeHttpClient } from '@effect/platform-node'
import { HttpClient } from '@effect/platform'
import { MatrixApi } from './lib/mxfx/api/matrix-api'
import { MatrixConfig } from './lib/mxfx'

const program = Effect.gen(function* () {
  const matrixUserName = yield* Config.string('MATRIX_USER_NAME')
  const matrixUserPassword = yield* Config.string('MATRIX_USER_PASSWORD')

  const config = yield* MatrixConfig.MatrixConfig

  yield* Effect.log({ matrixUserName, matrixUserPassword, matrixBaseUrl: config.baseUrl })
  const client = yield* HttpClient.HttpClient

  const api = yield* MatrixApi

  const x = yield* api.request()
})

NodeRuntime.runMain(
  program.pipe(
    Effect.provide(MatrixApi.Default),
    Effect.provide(MatrixConfig.layerConfig({ serverName: Config.string('MATRIX_HOME_SERVER') })),
    Effect.provide(NodeHttpClient.layer),
  ),
)

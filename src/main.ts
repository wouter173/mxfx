import { NodeHttpClient, NodeRuntime } from '@effect/platform-node'
import { Config, Effect, Redacted } from 'effect'
import { MatrixConfig } from 'mxfx'
import { MatrixApi, endpoints } from 'mxfx/api'
import { BaseHttpClient } from 'mxfx/api/http-client'
import { InMemoryVault, Vault } from 'mxfx/vault'

const program = Effect.gen(function* () {
  const matrixUserName = yield* Config.string('MATRIX_USER_NAME')
  const matrixUserPassword = yield* Config.redacted('MATRIX_USER_PASSWORD')

  const config = yield* MatrixConfig.MatrixConfig
  yield* Effect.log({ matrixUserName, matrixUserPassword, matrixBaseUrl: config.baseUrl })

  const matrixApi = yield* MatrixApi
  const vault = yield* Vault

  const { accessToken, userId } = yield* matrixApi.execute(
    endpoints.postLoginV3({
      type: 'm.login.password',
      password: Redacted.value(matrixUserPassword),
      identifier: { type: 'm.id.user', user: matrixUserName },
      initialDeviceDisplayName: 'mxfx-client',
    }),
  )

  yield* vault.setItem('accessToken', accessToken)
  const y = yield* matrixApi.execute(endpoints.getProfileV3({ userId }))
  yield* Effect.log(`Logged in as user ID: ${userId} with profile: ${JSON.stringify(y)}`)

  yield* matrixApi
    .execute(endpoints.getCapabilitiesV3())
    .pipe(Effect.tap(capabilities => Effect.log(`Server Capabilities: ${JSON.stringify(capabilities)}`)))

  // const users = yield* matrixApi.execute(postUserDirectorySearchV3({ searchTerm: 'wo', limit: 100 }))
})

NodeRuntime.runMain(
  program.pipe(
    Effect.provide(MatrixApi.Default),
    Effect.provide(MatrixConfig.layerConfig({ serverName: Config.string('MATRIX_HOME_SERVER') })),
    Effect.provide(BaseHttpClient.Default),
    Effect.provide(InMemoryVault),
    Effect.provide(NodeHttpClient.layer),
  ),
)

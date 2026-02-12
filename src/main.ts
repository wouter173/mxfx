import { NodeHttpClient, NodeRuntime } from '@effect/platform-node'
import { Config, Effect, Logger, LogLevel, Option, Redacted } from 'effect'
import { MatrixConfig } from 'mxfx'
import { MatrixApi, endpoints } from 'mxfx/api'
import { BaseHttpClient } from 'mxfx/api/http-client'
import { InMemoryVault, Vault } from 'mxfx/vault'
import { UserId } from '../packages/mxfx/src/branded'

const program = Effect.gen(function* () {
  const matrixUserName = yield* Config.string('MATRIX_USER_NAME')
  const matrixUserPassword = yield* Config.redacted('MATRIX_USER_PASSWORD')

  const matrixConfig = yield* MatrixConfig.MatrixConfig
  yield* Effect.log({ matrixUserName, matrixUserPassword, matrixBaseUrl: matrixConfig.baseUrl })

  const matrixApi = yield* MatrixApi
  const vault = yield* Vault

  const userId = yield* UserId(`@${matrixUserName}:${matrixConfig.serverName}`)
  const accessToken = yield* vault.getItem('accessToken')

  if (Option.isNone(accessToken)) {
    yield* Effect.log('No access token found in vault, logging in...')
    const loginResult = yield* matrixApi.execute(
      endpoints.postLoginV3({
        type: 'm.login.password',
        password: Redacted.value(matrixUserPassword),
        identifier: { type: 'm.id.user', user: matrixUserName },
        initialDeviceDisplayName: 'mxfx-client',
      }),
    )

    yield* vault.setItem('accessToken', loginResult.accessToken)
  }

  const y = yield* matrixApi.execute(endpoints.getProfileV3({ userId }))
  yield* Effect.log(`Logged in as user ID: ${userId} with profile: ${JSON.stringify(y)}`)

  // yield* matrixApi
  //   .execute(endpoints.getCapabilitiesV3())
  //   .pipe(Effect.tap(capabilities => Effect.log(`Server Capabilities: ${JSON.stringify(capabilities)}`)))

  // const users = yield* matrixApi.execute(postUserDirectorySearchV3({ searchTerm: 'wo', limit: 100 }))

  yield* matrixApi
    .execute(endpoints.getSyncV3({ fullState: true, setPresence: 'unavailable' }))
    .pipe(Effect.tap(syncResponse => Effect.log(`Sync response: ${JSON.stringify(syncResponse)}`)))
})

NodeRuntime.runMain(
  program.pipe(
    Effect.provide(MatrixApi.Default),
    Effect.provide(MatrixConfig.layerConfig({ serverName: Config.string('MATRIX_HOME_SERVER') })),
    Effect.provide(BaseHttpClient.Default),
    Effect.provide(InMemoryVault.layerConfig({ values: { accessToken: Config.string('MATRIX_ACCESS_TOKEN') } })),
    Effect.provide(NodeHttpClient.layer),
    Logger.withMinimumLogLevel(LogLevel.Debug),
  ),
)

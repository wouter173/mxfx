import { NodeHttpClient, NodeRuntime } from '@effect/platform-node'
import { Config, Duration, Effect, Layer, Logger, LogLevel, Option, PubSub, Redacted, Stream } from 'effect'
import { MatrixConfig } from 'mxfx'
import { MatrixApi, endpoints } from 'mxfx/api'
import { InMemoryVault, Vault } from 'mxfx/vault'
import { RoomId, UserId } from 'mxfx/branded'

const program = Effect.gen(function* () {
  const matrixUserName = yield* Config.string('MATRIX_USER_NAME')
  const matrixUserPassword = yield* Config.redacted('MATRIX_USER_PASSWORD')

  const matrixConfig = yield* MatrixConfig.MatrixConfig
  yield* Effect.log({ matrixUserName, matrixUserPassword, matrixBaseUrl: matrixConfig.baseUrl })

  const matrixApi = yield* MatrixApi
  const vault = yield* Vault

  const userId = yield* UserId.make(`@${matrixUserName}:${matrixConfig.serverName}`)
  const accessToken = yield* vault.getItem('accessToken')

  if (Option.isNone(accessToken)) {
    yield* Effect.log('No access token found in vault, logging in...')
    const loginResult = yield* endpoints
      .postLoginV3({
        type: 'm.login.password',
        password: Redacted.value(matrixUserPassword),
        identifier: { type: 'm.id.user', user: matrixUserName },
        initialDeviceDisplayName: 'mxfx-client',
      })
      .pipe(Effect.andThen(matrixApi.execute))

    yield* vault.setItem('accessToken', loginResult.accessToken)
  }

  const y = yield* endpoints.getProfileV3({ userId }).pipe(Effect.andThen(matrixApi.execute))
  yield* Effect.log(`Logged in as user ID: ${userId} with profile: ${JSON.stringify(y)}`)

  // yield* matrixApi
  //   .execute(endpoints.getCapabilitiesV3())
  //   .pipe(Effect.tap(capabilities => Effect.log(`Server Capabilities: ${JSON.stringify(capabilities)}`)))

  // const users = yield* matrixApi.execute(postUserDirectorySearchV3({ searchTerm: 'wo', limit: 100 }))

  const syncHub = yield* PubSub.unbounded<typeof endpoints.getSyncV3ResponseSchema.Type>()

  yield* Stream.fromPubSub(syncHub).pipe(
    Stream.runForEach(sync => Effect.log(`Received sync response: ${JSON.stringify(sync)}`)),
    Effect.fork,
  )

  yield* Stream.fromPubSub(syncHub).pipe(
    Stream.filterMap(sync => Option.fromNullable(sync.rooms?.invite)),
    Stream.mapConcat(invites => Object.entries(invites)),
    // Stream.tap(([roomId, invite]) => Effect.log(`Received invite for room ${roomId}: ${JSON.stringify(invite)}`)),
    Stream.map(([roomId, invite]) => ({
      invite,
      roomId,
      joinRules: Option.fromNullable(invite.inviteState?.events.find(e => e.type === 'm.room.join_rules')),
    })),
    Stream.filterEffect(({ joinRules, roomId }) =>
      Effect.gen(function* () {
        if (Option.isNone(joinRules)) {
          yield* Effect.log(`No join rules found for invite to room ${roomId}, skipping...`)
          return false
        }
        const isJoinable = ['public', 'invite', 'knock'].includes(joinRules.value.content.join_rule)
        if (!isJoinable) {
          yield* Effect.log(`Invite to room ${roomId} is not public, skipping... Join rule: ${joinRules.value.content.join_rule}`)
        }
        return isJoinable
      }),
    ),
    Stream.tap(({ invite, roomId }) =>
      Effect.log(`Received joinable invite for room ${roomId}, joining... Invite content: ${JSON.stringify(invite)}`),
    ),
    Stream.runForEach(({ roomId }) =>
      RoomId.make(roomId).pipe(
        Effect.andThen(roomId => endpoints.postRoomsJoinV3({ roomId })),
        Effect.andThen(matrixApi.execute),
      ),
    ),
    Effect.fork,
  )

  const syncLoop = Effect.iterate(
    { nextBatch: Option.none<string>() },
    {
      body: ({ nextBatch }) =>
        endpoints
          .getSyncV3({
            timeout: Duration.seconds(30),
            since: nextBatch.pipe(Option.getOrUndefined),
            fullState: nextBatch.pipe(Option.isNone),
          })
          .pipe(
            Effect.andThen(matrixApi.execute),
            Effect.tap(syncResponse => PubSub.publish(syncHub, syncResponse)),
            Effect.andThen(syncResponse => ({ nextBatch: Option.some(syncResponse.nextBatch) })),
          ),
      while: () => true,
    },
  )

  const syncLoopFiber = yield* Effect.forkDaemon(syncLoop)
  yield* syncLoopFiber.await
})

const mxfxLive = MatrixApi.Default.pipe(
  Layer.provideMerge(InMemoryVault.layerConfig({ values: { accessToken: Config.string('MATRIX_ACCESS_TOKEN') } })),
  Layer.provideMerge(MatrixConfig.layerConfig({ serverName: Config.string('MATRIX_HOME_SERVER') })),
  Layer.provide(NodeHttpClient.layer),
)

NodeRuntime.runMain(program.pipe(Effect.scoped, Effect.provide(mxfxLive), Logger.withMinimumLogLevel(LogLevel.Debug)))

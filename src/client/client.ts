import { Effect, Layer, ServiceMap, Option, PubSub, Ref, Duration, Stream } from 'effect'

import { endpoints, MatrixApi } from '../api'
import type { RoomId } from '../branded'
// import { MatrixStore } from '../store'
import { Vault } from '../vault'

const make = Effect.gen(function* () {
  // const store = yield* MatrixStore.MatrixStore
  const matrixApi = yield* MatrixApi.MatrixApi
  const vault = yield* Vault

  const login = ({ username, password }: { username: string; password: string }) =>
    //TODO: this should be abstracted into a seperate auth DI layer, and support multiple auth methods (e.g. password, token, SSO)
    /**
     * TODO: implement this with DI, multiple versions of auth (e.g. password, token, SSO) should be supported and
     * configurable, as long as it gives a token it is fine by me.
     */
    Effect.gen(function* () {
      const accessToken = yield* vault.getItem('accessToken')

      if (Option.isNone(accessToken)) {
        yield* Effect.log('No access token found in vault, logging in...')
        const loginResult = yield* endpoints
          .postLoginV3({
            type: 'm.login.password',
            identifier: { type: 'm.id.user', user: username },
            password: password,
            initialDeviceDisplayName: 'mxfx-client',
          })
          .pipe(Effect.andThen(matrixApi.execute))

        yield* vault.setItem('accessToken', loginResult.accessToken)
      }
    })

  const syncHub = yield* PubSub.unbounded<SyncFrame>()
  const syncStream = Stream.fromPubSub(syncHub)

  const nextBatchRef = yield* Ref.make(Option.none<string>())
  const syncOnce = Ref.get(nextBatchRef).pipe(
    Effect.flatMap(nextBatch =>
      endpoints
        .getSyncV3({
          timeout: Duration.seconds(30),
          since: nextBatch.pipe(Option.getOrUndefined),
          fullState: nextBatch.pipe(Option.isNone),
          filter: nextBatch.pipe(
            Option.match({
              onNone: () => '{"room":{"timeline":{"limit":0}}}',
              onSome: () => undefined,
            }),
          ),
        })
        .pipe(
          Effect.andThen(matrixApi.execute),
          Effect.tap(syncResponse => PubSub.publish(syncHub, syncResponse)),
          Effect.tap(syncResponse => Ref.set(nextBatchRef, Option.some(syncResponse.nextBatch))),
        ),
    ),
  )
  const syncLoop = () => Effect.forever(syncOnce)

  const onEvent = Effect.fnUntraced(function* <T extends { roomId: string; type: string; content: unknown }>(
    eventUnit: EventUnit<T>,
    f: (event: T) => Effect.Effect<void, never>,
  ) {
    yield* syncStream.pipe(eventUnit.predicate, Stream.runForEach(f), Effect.forkChild)
  })

  return {
    make: (params: { username: string; password: string }) =>
      Effect.succeed({
        login: () => login(params),
        syncLoop,
        onEvent,
      }),
    // makeConfig: ({ username, password }: { username: Config.Wrap<string>; password: Config.Wrap<string> }) =>
    //   Config.unwrap({ username, password })
    //     .asEffect()
    //     .pipe(
    //       Effect.andThen(params =>
    //         Effect.succeed({
    //           login: () => login(params),
    //           syncLoop,
    //         }),
    //       ),
    //     ),
  }
})

type SyncFrame = typeof endpoints.getSyncV3ResponseSchema.Type

type EventUnit<T extends { roomId: string; type: string; content: unknown }> = {
  predicate: (frame: Stream.Stream<SyncFrame>) => Stream.Stream<T>
}

export class MatrixClient extends ServiceMap.Service<
  MatrixClient,
  {
    make: ({ username, password }: { username: string; password: string }) => Effect.Effect<{
      login: () => Effect.Effect<void, unknown> //TODO: Type these errors
      syncLoop: () => Effect.Effect<never, unknown> //TODO: Type these errors
      onEvent: <T extends { roomId: RoomId; type: string; content: unknown }>(
        event: EventUnit<T>,
        f: (event: T) => Effect.Effect<void, never>,
      ) => Effect.Effect<void, unknown> //TODO: Type these errors
    }>
    // makeConfig: ({ username, password }: { username: Config.Wrap<string>; password: Config.Wrap<string> }) => Effect.Effect<
    //   {
    //     login: () => Effect.Effect<{ userId: UserId }, unknown> //TODO: Type these errors
    //     syncLoop: () => Effect.Effect<never, unknown> //TODO: Type these errors
    //   },
    //   unknown //TODO: Type these errors
    // >
  }
>()('mxfx/client') {}

export const MatrixClientLive = Layer.effect(MatrixClient, make)

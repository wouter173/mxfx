import { Array, Duration, Effect, Fiber, Ref, Schema, SubscriptionRef } from 'effect'
import { MatrixApi } from '../api/matrix-api'
import { ClientEventWithoutRoomIdSchema, RoomMessageEventPartialSchema } from '../api/schema/common'
import { SyncV3ResponseSchema } from '../api/schema/rest'
import { RoomId, type MxcUriType, type RoomIdType } from '../branded'
import { MatrixClientSessionStore } from './matrix-client-session-store'
import { MatrixClientStore } from './matrix-client-store'

export class MatrixClient extends Effect.Service<MatrixClient>()('mxfx/MatrixClient', {
  effect: Effect.gen(function* () {
    const matrixClientSessionStore = yield* MatrixClientSessionStore
    const matrixApi = yield* MatrixApi
    const store = yield* MatrixClientStore

    yield* Effect.log('MatrixClient created')

    let syncLoopFiber: Fiber.RuntimeFiber<{ next_batch?: string }, never> | null = null
    const startSyncLoop = Effect.gen(function* () {
      syncLoopFiber = yield* Effect.forkDaemon(
        Effect.iterate(
          { next_batch: undefined as string | undefined },
          {
            body: ({ next_batch }) =>
              Effect.gen(function* () {
                const urlParams = next_batch
                  ? {
                      timeout: Duration.toMillis(Duration.seconds(30)),
                      full_state: false,
                      since: next_batch,
                    }
                  : { full_state: true }

                const syncWithTokenRefresh = matrixApi.sync.get({ urlParams })

                const res = (yield* Effect.retry(syncWithTokenRefresh, {
                  times: 1,
                })) as Schema.Schema.Type<typeof SyncV3ResponseSchema>

                yield* SubscriptionRef.updateEffect(store.ref, state =>
                  Effect.gen(function* () {
                    yield* Effect.forEach(res.account_data?.events ?? [], event => Effect.log(event))

                    const roomIds = yield* Effect.forEach(
                      new Set([...Object.keys(res.rooms?.join ?? {}), ...Object.keys(state.rooms)]),
                      RoomId,
                    )

                    for (const roomId of roomIds) {
                      if (!state.rooms[roomId]) {
                        state.rooms[roomId] = { name: roomId, messages: [] }
                      }

                      const events = res.rooms?.join?.[roomId]?.timeline?.events ?? []
                      const messages = Array.filterMap(events, a =>
                        Schema.decodeUnknownOption(
                          Schema.Struct({
                            ...ClientEventWithoutRoomIdSchema.fields,
                            ...RoomMessageEventPartialSchema.fields,
                          }),
                        )(a),
                      )

                      const name = (
                        res.rooms?.join?.[roomId]?.state?.events?.find(e => e.type === 'm.room.name')?.content as
                          | { name?: string }
                          | undefined
                      )?.name as string | undefined

                      if (name) {
                        state.rooms[roomId].name = name
                      }

                      if (messages.length > 0) {
                        state.rooms[roomId].messages.push(...messages)
                      }
                    }

                    return { ...state }
                  }),
                )

                return { next_batch: res.next_batch }
              }).pipe(
                Effect.catchAll(err => {
                  console.error(
                    'Sync error',
                    err,
                    JSON.stringify(err),
                    err.stack,
                    err.message,
                    err.cause instanceof Error ? err.cause.message : null,
                  )
                  return Effect.sleep(Duration.seconds(5)).pipe(Effect.as({ next_batch }))
                }),
              ),
            while: () => true,
          },
        ),
      )
    })

    const api = {
      mxc: {
        toSource: (uri?: MxcUriType) =>
          Effect.gen(function* () {
            const session = yield* matrixClientSessionStore.get()
            const url = `${session.baseUrl}/_matrix/client/v1/media/download/${uri?.replace('mxc://', '')}`

            return {
              uri: url,
              headers: {
                Authorization: `Bearer ${session.credentials.token}`,
              },
            }
          }),
      },

      login: ({
        deviceId,
        baseUrl,
        credentials: { token, refreshToken },
      }: {
        deviceId: string
        baseUrl: string
        credentials: { token: string; refreshToken?: string }
      }) =>
        Effect.gen(function* () {
          if (syncLoopFiber) {
            yield* Fiber.interrupt(syncLoopFiber)
            syncLoopFiber = null
          }

          yield* matrixClientSessionStore.set({ baseUrl, deviceId, credentials: { token, refreshToken } })

          const me = yield* matrixApi.account.whoami.get().pipe(
            Effect.tap(res => Effect.logDebug(`Logged in as user ID: ${res.user_id}`)),
            Effect.catchTag('mxfx/ApiHttpError', e =>
              Effect.gen(function* () {
                yield* Effect.logError(`Failed to get user ID: ${e.message}`)
                yield* matrixClientSessionStore.delete()
              }).pipe(Effect.die),
            ),
          )

          const user = yield* matrixApi.profile
            .get({ userId: me.user_id })
            .pipe(Effect.tap(res => Effect.logDebug(`Fetched profile for user ID: ${me.user_id}, display name: ${res.displayname}`)))

          yield* SubscriptionRef.update(store.ref, () => ({
            user: { id: me.user_id, displayName: user.displayname, avatarUrl: user.avatar_url },
            rooms: {},
            cache: { mxcServerMap: {} },
          }))
          yield* startSyncLoop
        }),

      logout: Effect.gen(function* () {
        if (syncLoopFiber) {
          yield* Fiber.interrupt(syncLoopFiber)
          syncLoopFiber = null
        }

        yield* matrixClientSessionStore.delete()
        yield* store.reset()
      }),

      loadMessages: (roomId: RoomIdType) =>
        Effect.gen(function* () {
          const state = yield* store.get()
          const from = state.rooms[roomId]?.lastBatchId

          const res = yield* matrixApi.room.messages.get({ roomId, urlParams: { dir: 'b', limit: 100, from } })

          const messages = Array.filterMap(res.chunk, a =>
            Schema.decodeUnknownOption(
              Schema.Struct({
                ...ClientEventWithoutRoomIdSchema.fields,
                ...RoomMessageEventPartialSchema.fields,
              }),
            )(a),
          )

          yield* Ref.update(store.ref, state => {
            if (!state.rooms[roomId]) {
              state.rooms[roomId] = { name: roomId, messages: [] }
            }

            const existingMessageIds = new Set(state.rooms[roomId].messages.map(m => m.event_id))
            const filteredNewMessages = messages.filter(m => !existingMessageIds.has(m.event_id))

            state.rooms[roomId].messages.unshift(...filteredNewMessages)
            state.rooms[roomId].messages.sort((a, b) => a.origin_server_ts - b.origin_server_ts)
            if (res.end) state.rooms[roomId].lastBatchId = res.end

            return { ...state }
          })
        }),

      sendTextMessage: ({ roomId, text }: { roomId: RoomIdType; text: string }) =>
        Effect.gen(function* () {
          yield* matrixApi.room.send.put({
            roomId,
            body: { msgtype: 'm.text', body: text },
          })
        }),
    }

    const session = yield* matrixClientSessionStore.get().pipe(Effect.catchAll(() => Effect.succeed(null)))
    if (session) {
      yield* api.login(session)
    }

    return { store, api }
  }),

  dependencies: [MatrixApi.Default, MatrixClientStore.Default, MatrixClientSessionStore.Default],
}) {}

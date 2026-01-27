import { HttpBody, HttpClient, HttpClientResponse } from '@effect/platform'

import { Effect } from 'effect'
import type { RoomIdType, UserIdType } from '../branded'
import { MatrixHttpClient } from './matrix-http-client'
import {
  AccountWhoamiV3ResponseSchema,
  LoginV3ResponseSchema,
  ProfileV3ResponseSchema,
  RefreshV3ResponseSchema,
  RoomMessageV3ResponseSchema,
  SyncV3ResponseSchema,
  VersionsResponseSchema,
} from './schema/rest'

export class MatrixApi extends Effect.Service<MatrixApi>()('mxfx/MatrixApi', {
  effect: Effect.gen(function* () {
    // const matrixHttp = yield* MatrixHttpClient
    // const { client: matrixHttpClient, setMatrixBaseUrl, setAuthToken } = matrixHttp

    return {
      request: <A, E, R>(request: Effect.Effect<A, E, R>) => request.pipe(Effect.provide(MatrixHttpClient.Default)),
    }

    // return {
    //   versions: {
    //     get: Effect.fn('mxfx/MatrixApi/versions')(function* () {
    //       const res = yield* matrixHttpClient
    //         .pipe(HttpClient.mapRequestEffect(setMatrixBaseUrl))
    //         .get('/versions')
    //         .pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(VersionsResponseSchema)))

    //       return res
    //     }),
    //   },

    //   refresh: {
    //     post: (options: { body: { refresh_token: string } }) =>
    //       Effect.gen(function* () {
    //         const body = yield* HttpBody.json(options.body)

    //         const res = yield* matrixHttpClient
    //           .pipe(HttpClient.mapRequestEffect(setMatrixBaseUrl))
    //           .post('/v3/refresh', { body })
    //           .pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(RefreshV3ResponseSchema)))

    //         return res
    //       }),
    //   },

    //   login: {
    //     get: () =>
    //       Effect.gen(function* () {
    //         const res = yield* matrixHttpClient
    //           .pipe(HttpClient.mapRequestEffect(setMatrixBaseUrl))
    //           .get('/v3/login')
    //           .pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(LoginFlowsV3ResponseSchema)))

    //         return res
    //       }),
    //     post: (options: {
    //       body: { type: 'm.login.token'; token: string } & { initial_device_display_name?: string; refresh_token?: boolean }
    //     }) =>
    //       Effect.gen(function* () {
    //         const body = yield* HttpBody.json(options.body)

    //         const res = yield* matrixHttpClient
    //           .pipe(HttpClient.mapRequestEffect(setMatrixBaseUrl))
    //           .post('/v3/login', { body })
    //           .pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(LoginV3ResponseSchema)))

    //         return res
    //       }),
    //   },

    //   sync: {
    //     get: (options: {
    //       urlParams?: { filter?: string; set_presence?: 'offline' | 'online' | 'unavailable'; since?: string } & (
    //         | { full_state?: boolean }
    //         | { full_state: false; timeout?: number }
    //       )
    //     }) =>
    //       Effect.gen(function* () {
    //         const res = yield* matrixHttpClient
    //           .pipe(HttpClient.mapRequestEffect(setMatrixBaseUrl), HttpClient.mapRequestEffect(setAuthToken))
    //           .get(`/v3/sync`, { urlParams: options.urlParams })
    //           .pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(SyncV3ResponseSchema)))

    //         return res
    //       }),
    //   },

    //   room: {
    //     messages: {
    //       get: (options: {
    //         roomId: RoomIdType
    //         urlParams: { dir: 'b' | 'f'; from?: string; filter?: string; limit?: number; to?: string }
    //       }) =>
    //         Effect.gen(function* () {
    //           const res = yield* matrixHttpClient
    //             .pipe(HttpClient.mapRequestEffect(setMatrixBaseUrl), HttpClient.mapRequestEffect(setAuthToken))
    //             .get(`/v3/rooms/${options.roomId}/messages`, { urlParams: options.urlParams })
    //             .pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(RoomMessageV3ResponseSchema)))

    //           return res
    //         }),
    //     },
    //     send: {
    //       put: (options: { roomId: RoomIdType; body: { msgtype: 'm.text'; body: string } }) =>
    //         Effect.gen(function* () {
    //           const eventType = 'm.room.message'
    //           const txnId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    //           const body = yield* HttpBody.json(options.body)
    //           const res = yield* matrixHttpClient
    //             .pipe(HttpClient.mapRequestEffect(setMatrixBaseUrl), HttpClient.mapRequestEffect(setAuthToken))
    //             .put(`/v3/rooms/${options.roomId}/send/${eventType}/${txnId}`, { body })

    //           return res
    //         }),
    //     },
    //   },

    //   profile: {
    //     get: (options: { userId: UserIdType }) =>
    //       Effect.gen(function* () {
    //         const res = yield* matrixHttpClient
    //           .pipe(HttpClient.mapRequestEffect(setMatrixBaseUrl), HttpClient.mapRequestEffect(setAuthToken))
    //           .get(`/v3/profile/${options.userId}`)
    //           .pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(ProfileV3ResponseSchema)))

    //         return res
    //       }),
    //   },

    //   account: {
    //     whoami: {
    //       get: () =>
    //         Effect.gen(function* () {
    //           const res = yield* matrixHttpClient
    //             .pipe(HttpClient.mapRequestEffect(setMatrixBaseUrl), HttpClient.mapRequestEffect(setAuthToken))
    //             .get('/v3/account/whoami')
    //             .pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(AccountWhoamiV3ResponseSchema)))

    //           return res
    //         }),
    //     },
    //   },
    // }
  }),
  // dependencies: [MatrixHttpClient.Default],
}) {}

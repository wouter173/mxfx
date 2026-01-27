import { Effect, Schema } from 'effect'
import { MatrixHttpClient } from '../matrix-http-client'
import { HttpClientResponse } from '@effect/platform'

export const LoginFlowsV3ResponseSchema = Schema.Struct({
  flows: Schema.Array(Schema.Struct({ type: Schema.String })),
})

export const getLoginV3 = Effect.gen(function* () {
  const matrixHttp = yield* MatrixHttpClient

  const res = yield* matrixHttp.client.get('/v3/login').pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(LoginFlowsV3ResponseSchema)))

  return res
})

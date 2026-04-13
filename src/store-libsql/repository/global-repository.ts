import { Effect, Layer, Option, Schema } from 'effect'
import { SqlClient } from 'effect/unstable/sql'

import { DecodingError, StoreError } from '../../store/error'
import { GlobalData, GlobalRepository } from '../../store/repository/global-repository'

const dataSchema = GlobalData.pipe(Schema.encodeKeys({ nextBatch: 'next_batch' }))

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  return {
    get: Effect.fn(function* () {
      const res = yield* sql`SELECT next_batch FROM global WHERE id = 0`.pipe(
        Effect.mapError(err => new StoreError({ message: 'Failed to get row', reason: err })),
      )

      const data = yield* Schema.decodeUnknownEffect(Schema.Array(dataSchema))(res).pipe(
        Effect.mapError(err => new DecodingError({ cause: err, message: 'Failed to decode global row' })),
        Effect.mapError(err => new StoreError({ reason: err })),
      )

      const first = data[0]

      if (first === undefined) {
        return { nextBatch: Option.none<string>() }
      }

      return first
    }),

    setNextBatchToken: Effect.fn(function* (nextBatchToken: string) {
      yield* sql`
        INSERT INTO global (id, next_batch)
        VALUES (0, ${nextBatchToken})
        ON CONFLICT(id) DO UPDATE SET next_batch = ${nextBatchToken}
      `.pipe(Effect.mapError(err => new StoreError({ message: 'Failed to set next batch token in global repository', reason: err })))
    }),
  }
})

export const globalRepositoryLibSQLLive = Layer.effect(GlobalRepository, make)

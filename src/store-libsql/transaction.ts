import { Effect, Layer } from 'effect'
import { SqlClient } from 'effect/unstable/sql'
import { SqlError } from 'effect/unstable/sql/SqlError'

import { StoreError } from '../store/error'
import { Transaction } from '../store/transaction'

export const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  return {
    withTransaction: <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E | StoreError, R> =>
      sql.withTransaction(effect).pipe(Effect.mapError(err => (err instanceof SqlError ? new StoreError({ reason: err }) : err))),
  }
})

export const transactionProviderLibSQLLive = Layer.effect(Transaction, make)

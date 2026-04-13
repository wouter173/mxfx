import { Effect, ServiceMap } from 'effect'

import type { StoreError } from './error'

export class Transaction extends ServiceMap.Service<
  Transaction,
  {
    withTransaction: <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E | StoreError, R>
  }
>()('mxfx/store/transaction') {}

export const transactional = <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E | StoreError, R | Transaction> =>
  Effect.gen(function* () {
    const transaction = yield* Transaction

    return yield* transaction.withTransaction(effect)
  })

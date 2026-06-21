import { Effect } from 'effect'

import { Store } from '../../store'
import type { ReducerShape } from './reducer'

export const nextBatchReducer: ReducerShape = {
  reduce: sync =>
    Effect.gen(function* () {
      const store = yield* Store
      yield* store.setNextBatch(sync.nextBatch)
    }),
}

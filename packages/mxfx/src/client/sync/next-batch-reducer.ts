import { Effect } from 'effect'

import { Store } from '../../store/index.ts'
import type { ReducerShape } from './reducer.ts'

export const nextBatchReducer: ReducerShape = {
  reduce: sync =>
    Effect.gen(function* () {
      const store = yield* Store
      yield* store.setNextBatch(sync.nextBatch)
    }),
}

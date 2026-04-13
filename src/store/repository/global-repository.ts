import { Effect, Schema, ServiceMap } from 'effect'

import type { StoreError } from '../error'

export const GlobalData = Schema.Struct({
  nextBatch: Schema.OptionFromNullishOr(Schema.String),
})

export class GlobalRepository extends ServiceMap.Service<
  GlobalRepository,
  {
    get: () => Effect.Effect<typeof GlobalData.Type, StoreError>
    setNextBatchToken: (nextBatchToken: string) => Effect.Effect<void, StoreError>
  }
>()('mxfx/store/GlobalRepository') {}

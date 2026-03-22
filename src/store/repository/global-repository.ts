import { Effect, Layer, ServiceMap } from 'effect'

import type { SyncResponse } from '../types'

type Data = Pick<SyncResponse, 'nextBatch'>

export class GlobalRepository extends ServiceMap.Service<
  GlobalRepository,
  {
    get: () => Effect.Effect<Data>
    reduce: (syncResponse: Data) => Effect.Effect<void>
  }
>()('mxfx/store/GlobalRepository') {}

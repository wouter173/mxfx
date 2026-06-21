import { Context, Data, Layer, type Effect } from 'effect'

import type { getSyncV3ResponseSchema } from '../../api/endpoints'
import { nextBatchReducer } from './next-batch-reducer'
import { roomStateReducer } from './room-state-reducer'
import { roomTimelineReducer } from './room-timeline-reducer'

export class ReduceError extends Data.TaggedError('mxfx/ReduceError')<{
  message: string
  cause?: unknown
}> {}

export type ReducerShape = {
  reduce: (sync: typeof getSyncV3ResponseSchema.Type) => Effect.Effect<void, ReduceError>
}

export class Reducers extends Context.Service<Reducers, ReadonlyArray<ReducerShape>>()('mxfx/client/reducers') {
  static layer = Layer.succeed(Reducers, [roomStateReducer, nextBatchReducer, roomTimelineReducer])
}

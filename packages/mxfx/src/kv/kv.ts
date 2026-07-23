import { Context, Data, Effect, Option } from 'effect'

import { makeInMemoryKv } from './in-memory-kv.ts'

export class KvGetError extends Data.TaggedError('mxfx/kv/get-error')<{
  cause?: unknown
}> {}

export type KvShape = {
  set: (key: string, value: string) => Effect.Effect<void>
  getString: (key: string) => Effect.Effect<Option.Option<string>, KvGetError>
}

export const Kv = Context.Reference<KvShape>('mxfx/kv', { defaultValue: makeInMemoryKv })
export type Kv = typeof Kv

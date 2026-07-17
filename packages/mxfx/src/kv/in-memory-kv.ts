import { Effect, Schema } from 'effect'

import { KvGetError, type KvShape } from './kv.ts'

export const makeInMemoryKv = (): KvShape => {
  const kv = new Map()

  return {
    set: (key: string, value: string) => Effect.sync(() => kv.set(key, value)),
    getString: (key: string) =>
      Effect.try(() => kv.get(key)).pipe(
        Effect.andThen(Schema.decodeUnknownEffect(Schema.OptionFromOptional(Schema.String))),
        Effect.mapError(e => new KvGetError({ cause: e })),
      ),
  }
}

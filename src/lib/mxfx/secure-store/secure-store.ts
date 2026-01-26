import { Context, Data, Effect } from 'effect'

export class SecureStoreError extends Data.TaggedError('mxfx/SecureStoreError')<{ message: string; cause?: unknown }> {}

export class SecureStore extends Context.Tag('mxfx/SecureStore')<
  SecureStore,
  {
    setItem: (key: string, value: string) => Effect.Effect<void, SecureStoreError>
    getItem: (key: string) => Effect.Effect<string | null, SecureStoreError>
    deleteItem: (key: string) => Effect.Effect<void, SecureStoreError>
    isAvailableAsync: () => Effect.Effect<boolean, SecureStoreError>
  }
>() {}

import { Context, Data, Effect } from 'effect'

export class VaultError extends Data.TaggedError('mxfx/VaultError')<{ message: string; cause?: unknown }> {}

export class Vault extends Context.Tag('mxfx/Vault')<
  Vault,
  {
    setItem: (key: string, value: string) => Effect.Effect<void, VaultError>
    getItem: (key: string) => Effect.Effect<string | null, VaultError>
    deleteItem: (key: string) => Effect.Effect<void, VaultError>
    isAvailable: () => Effect.Effect<boolean, VaultError>
  }
>() {}

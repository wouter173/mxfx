import { ServiceMap, Data, Effect, Option } from 'effect'

export class VaultError extends Data.TaggedError('mxfx/VaultError')<{
  message: string
  cause?: unknown
}> {}

export class Vault extends ServiceMap.Service<
  Vault,
  {
    setItem: (key: string, value: string) => Effect.Effect<void, VaultError>
    getItem: (key: string) => Effect.Effect<Option.Option<string>, VaultError>
    deleteItem: (key: string) => Effect.Effect<void, VaultError>
    isAvailable: () => Effect.Effect<boolean, VaultError>
  }
>()('mxfx/Vault') {}

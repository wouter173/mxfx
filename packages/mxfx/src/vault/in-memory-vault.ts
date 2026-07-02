import { Config, Effect, Layer, Option } from 'effect'

import { Vault } from './vault.ts'

type MakeOpts = {
  values?: Record<string, string>
}

const make = ({ values = {} }: MakeOpts = {}) =>
  Effect.gen(function* () {
    yield* Effect.logDebug('Creating InMemoryVault')
    const storage = new Map<string, string>(Object.entries(values))

    return {
      setItem: (key: string, value: string) =>
        Effect.sync(() => {
          storage.set(key, value)
        }),

      getItem: (key: string) => Effect.sync(() => Option.fromNullishOr(storage.get(key))),

      deleteItem: (key: string) =>
        Effect.sync(() => {
          storage.delete(key)
        }),

      isAvailable: () => Effect.succeed(true),
    }
  })

export const layerInMemoryVault = Layer.effect(Vault, make())
export const layerInMemoryVaultDefault = (opts: MakeOpts) => Layer.effect(Vault, make(opts))
export const layerInMemoryVaultConfig = (optsConfig: Config.Wrap<MakeOpts>) =>
  Layer.effect(Vault, Effect.andThen(Config.unwrap(optsConfig), make))

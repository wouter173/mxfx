import { Effect, Layer, Option } from 'effect'
import { Vault } from './vault'

const storage = new Map<string, string>()

export const InMemoryVault = Layer.succeed(Vault, {
  setItem: (key: string, value: string) => Effect.sync(() => storage.set(key, value)),
  getItem: (key: string) => Effect.sync(() => Option.fromNullable(storage.get(key))),
  deleteItem: (key: string) => Effect.sync(() => storage.delete(key)),
  isAvailable: () => Effect.succeed(true),
})

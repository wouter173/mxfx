import { Effect, Layer, Option } from 'effect'
import { deleteItemAsync, getItem, isAvailableAsync, setItem } from 'expo-secure-store'
import { Vault, VaultError } from './vault'

export const ExpoSecureStoreVault = Layer.succeed(Vault, {
  setItem: (key: string, value: string) =>
    Effect.try({
      try: () => setItem(key, value),
      catch: e => new VaultError({ message: `Error setting item in secure store: ${e}`, cause: e }),
    }),
  getItem: (key: string) =>
    Effect.try({
      try: () => Option.fromNullable(getItem(key)),
      catch: e => new VaultError({ message: `Error getting item from secure store: ${e}`, cause: e }),
    }),
  deleteItem: (key: string) =>
    Effect.tryPromise({
      try: () => deleteItemAsync(key),
      catch: e => new VaultError({ message: `Error deleting item from secure store: ${e}`, cause: e }),
    }),
  isAvailable: () =>
    Effect.tryPromise({
      try: () => isAvailableAsync(),
      catch: e => new VaultError({ message: `Error checking secure store availability: ${e}`, cause: e }),
    }),
})

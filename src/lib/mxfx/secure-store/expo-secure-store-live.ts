import { Effect, Layer } from 'effect'
import { deleteItemAsync, getItem, isAvailableAsync, setItem } from 'expo-secure-store'
import { SecureStore, SecureStoreError } from './secure-store'

export const ExpoSecureStoreLive = Layer.succeed(SecureStore, {
  setItem: (key: string, value: string) =>
    Effect.try({
      try: () => setItem(key, value),
      catch: (e) => new SecureStoreError({ message: `Error setting item in secure store: ${e}`, cause: e }),
    }),
  getItem: (key: string) =>
    Effect.try({
      try: () => getItem(key),
      catch: (e) => new SecureStoreError({ message: `Error getting item from secure store: ${e}`, cause: e }),
    }),
  deleteItem: (key: string) =>
    Effect.tryPromise({
      try: () => deleteItemAsync(key),
      catch: (e) => new SecureStoreError({ message: `Error deleting item from secure store: ${e}`, cause: e }),
    }),
  isAvailableAsync: () =>
    Effect.tryPromise({
      try: () => isAvailableAsync(),
      catch: (e) => new SecureStoreError({ message: `Error checking secure store availability: ${e}`, cause: e }),
    }),
})

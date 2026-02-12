import { Effect, Layer, Option } from 'effect'
import { FileSystem, Path } from '@effect/platform'
import { Vault, VaultError } from './vault'

export type MakeOpts = {
  filePath: string
}

export const make = (config: MakeOpts) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    let cache: Map<string, string> | null = null

    const ensureDir = fs.makeDirectory(path.dirname(config.filePath), { recursive: true }).pipe(
      Effect.catchAll(() => Effect.void),
      Effect.mapError(cause => new VaultError({ message: 'Failed to create vault directory', cause })),
    )

    const load = Effect.gen(function* () {
      const exists = yield* fs.exists(config.filePath)

      if (!exists) {
        return new Map<string, string>()
      }

      const content = yield* fs.readFileString(config.filePath)
      const parsed = JSON.parse(content)
      return new Map<string, string>(Object.entries(parsed))
    }).pipe(
      Effect.mapError(cause => new VaultError({ message: 'Failed to load vault', cause })),
      Effect.catchAll(() => Effect.succeed(new Map<string, string>())),
    )

    const save = (data: Map<string, string>) =>
      Effect.gen(function* () {
        yield* ensureDir
        const json = JSON.stringify(Object.fromEntries(data), null, 2)
        yield* fs
          .writeFileString(config.filePath, json)
          .pipe(Effect.mapError(cause => new VaultError({ message: 'Failed to save vault', cause })))
      })

    const getCache = Effect.gen(function* () {
      if (cache === null) {
        cache = yield* load
      }
      return cache
    })

    return {
      setItem: (key: string, value: string) =>
        Effect.gen(function* () {
          const storage = yield* getCache
          storage.set(key, value)
          yield* save(storage)
        }),

      getItem: (key: string) =>
        Effect.gen(function* () {
          const storage = yield* getCache
          return Option.fromNullable(storage.get(key))
        }),

      deleteItem: (key: string) =>
        Effect.gen(function* () {
          const storage = yield* getCache
          storage.delete(key)
          yield* save(storage)
        }),

      isAvailable: () => Effect.succeed(true),
    }
  })

export const layer = (opts: MakeOpts) => Layer.effect(Vault, make(opts))

import { Data, Effect, Schema } from 'effect'
import { Service } from 'effect/Effect'
import { SecureStore } from '../secure-store/secure-store'

export class SecureStoreError extends Data.TaggedError('mxfx/SecureStoreError')<{ message: string; cause?: unknown }> {}

export const SessionSchema = Schema.parseJson(
  Schema.Struct({
    baseUrl: Schema.String,
    deviceId: Schema.String,
    credentials: Schema.Struct({
      token: Schema.String,
      refreshToken: Schema.optional(Schema.String),
    }),
  }),
)

export class MatrixClientSessionStore extends Service<MatrixClientSessionStore>()('mxfx/MatrixClientSessionStore', {
  effect: Effect.gen(function* () {
    const secureStore = yield* SecureStore

    return {
      set: (session: typeof SessionSchema.Type) =>
        Schema.encode(SessionSchema)(session).pipe(Effect.flatMap((encoded) => secureStore.setItem('session', encoded))),

      get: () =>
        secureStore
          .getItem('session')
          .pipe(Effect.flatMap((item) => Schema.decodeUnknown(SessionSchema)(item)))
          .pipe(Effect.orElseFail(() => new SecureStoreError({ message: 'No session found in secure store' }))),

      delete: () => secureStore.deleteItem('session'),
    }
  }),
}) {}

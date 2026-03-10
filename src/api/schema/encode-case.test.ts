import { describe, it, expect } from '@effect/vitest'
import { Effect, Schema } from 'effect'

import { encodeSnakeCaseKeys } from './encode-case'

describe('encode test', () => {
  it.effect('simple struct', () =>
    Effect.gen(function* () {
      const xSchema = Schema.Struct({
        userName: Schema.String,
      }).pipe(encodeSnakeCaseKeys)

      const encoded = yield* Schema.encodeEffect(xSchema)({ userName: 'test' })

      expect(encoded).toEqual({ user_name: 'test' })
    }),
  )

  it.effect('nested struct', () =>
    Effect.gen(function* () {
      const xSchema = Schema.Struct({
        userName: Schema.String,
        profile: Schema.Struct({
          displayName: Schema.String,
        }),
      }).pipe(encodeSnakeCaseKeys)

      const encoded = yield* Schema.encodeEffect(xSchema)({ userName: 'test', profile: { displayName: 'Test User' } })

      expect(encoded).toEqual({ user_name: 'test', profile: { display_name: 'Test User' } })
    }),
  )

  it.effect('array fields are transformed recursively', () =>
    Effect.gen(function* () {
      const xSchema = Schema.Struct({
        userName: Schema.String,
        tags: Schema.Array(Schema.Struct({ tagName: Schema.String })),
      }).pipe(encodeSnakeCaseKeys)

      const encoded = yield* Schema.encodeEffect(xSchema)({
        userName: 'test',
        tags: [{ tagName: 'tag1' }, { tagName: 'tag2' }],
      })

      expect(encoded).toEqual({
        user_name: 'test',
        tags: [{ tag_name: 'tag1' }, { tag_name: 'tag2' }],
      })
    }),
  )

  it.effect('struct with optional fields', () =>
    Effect.gen(function* () {
      const xSchema = Schema.Struct({
        userName: Schema.String,
        displayName: Schema.optional(Schema.String),
      }).pipe(encodeSnakeCaseKeys)

      const encoded = yield* Schema.encodeEffect(xSchema)({ userName: 'test' })

      expect(encoded).toEqual({ user_name: 'test' })
    }),
  )

  it.effect('struct with union fields', () =>
    Effect.gen(function* () {
      const xSchema = Schema.Struct({
        userName: Schema.String,
        identifier: Schema.Union([
          Schema.Struct({ type: Schema.Literal('user'), userName: Schema.String }),
          Schema.Struct({ type: Schema.Literal('email'), emailAdress: Schema.String }),
        ]),
      }).pipe(encodeSnakeCaseKeys)

      const encoded = yield* Schema.encodeEffect(xSchema)({
        userName: 'test',
        identifier: { type: 'user', userName: 'testuser' },
      })

      expect(encoded).toEqual({
        user_name: 'test',
        identifier: { type: 'user', user_name: 'testuser' },
      })
    }),
  )

  it.effect('top-level union', () =>
    Effect.gen(function* () {
      const xSchema = Schema.Struct({
        options: Schema.Union([
          Schema.Struct({ type: Schema.Literal('user'), userName: Schema.String }),
          Schema.Struct({ type: Schema.Literal('email'), emailAddress: Schema.String }),
        ]),
      }).pipe(encodeSnakeCaseKeys)

      const encoded = yield* Schema.encodeEffect(xSchema)({
        options: { type: 'email', emailAddress: 'test@example.com' },
      })

      expect(encoded).toEqual({ options: { type: 'email', email_address: 'test@example.com' } })
    }),
  )

  it.effect('nested union in array is transformed recursively', () =>
    Effect.gen(function* () {
      const xSchema = Schema.Struct({
        results: Schema.Array(
          Schema.Union([
            Schema.Struct({ type: Schema.Literal('user'), userName: Schema.String }),
            Schema.Struct({ type: Schema.Literal('email'), emailAddress: Schema.String }),
          ]),
        ),
      }).pipe(encodeSnakeCaseKeys)

      const encoded = yield* Schema.encodeEffect(xSchema)({
        results: [
          { type: 'user', userName: 'alice' },
          { type: 'email', emailAddress: 'alice@example.com' },
        ],
      })

      expect(encoded).toEqual({
        results: [
          { type: 'user', user_name: 'alice' },
          { type: 'email', email_address: 'alice@example.com' },
        ],
      })
    }),
  )

  it.effect('union with nested struct', () =>
    Effect.gen(function* () {
      const xSchema = Schema.Union([
        Schema.Struct({ type: Schema.Literal('user'), userName: Schema.String }),
        Schema.Struct({
          type: Schema.Literal('email'),
          emailAddress: Schema.String,
          profile: Schema.Struct({ displayName: Schema.String }),
        }).pipe(encodeSnakeCaseKeys),
      ])

      const encoded = yield* Schema.encodeEffect(xSchema)({
        type: 'email',
        emailAddress: 'alice@example.com',
        profile: { displayName: 'Alice' },
      })

      expect(encoded).toEqual({
        type: 'email',
        email_address: 'alice@example.com',
        profile: { display_name: 'Alice' },
      })
    }),
  )

  it.effect('struct with namespaced keys', () =>
    Effect.gen(function* () {
      const xSchema = Schema.Struct({
        userName: Schema.String,
        'm.newContent': Schema.Struct({
          body: Schema.String,
          msgtype: Schema.String,
        }),
      }).pipe(encodeSnakeCaseKeys)

      const encoded = yield* Schema.encodeEffect(xSchema)({
        userName: 'test',
        'm.newContent': { body: 'Hello', msgtype: 'text' },
      })

      expect(encoded).toEqual({
        user_name: 'test',
        'm.new_content': { body: 'Hello', msgtype: 'text' },
      })
    }),
  )

  it.effect('opaque class struct', () =>
    Effect.gen(function* () {
      class schema extends Schema.Opaque<schema>()(
        Schema.Struct({
          userName: Schema.String,
        }).pipe(encodeSnakeCaseKeys),
      ) {}

      const encoded = yield* Schema.encodeEffect(schema)({ userName: 'test' })

      expect(encoded).toEqual({ user_name: 'test' })
    }),
  )

  it.effect('opaque class struct recursive', () =>
    Effect.gen(function* () {
      class schema extends Schema.Opaque<schema>()(
        Schema.Struct({
          userName: Schema.String,
          nested: Schema.optional(Schema.suspend((): Schema.Codec<schema, schemaEncoded, schema, schema> => schema)),
        }).pipe(encodeSnakeCaseKeys),
      ) {}

      interface schemaEncoded extends Schema.Codec.Encoded<typeof schema> {}

      const encoded = yield* Schema.encodeEffect(schema)({
        userName: 'test',
        nested: { userName: 'nested', nested: { userName: 'nested2' } },
      })

      expect(encoded).toEqual({
        user_name: 'test',
        nested: { user_name: 'nested', nested: { user_name: 'nested2' } },
      })
    }),
  )
})

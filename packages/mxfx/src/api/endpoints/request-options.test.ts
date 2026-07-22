import { describe, expect, it } from '@effect/vitest'
import { Effect, Schema } from 'effect'

import { makeEndpoint } from './endpoint.ts'
import * as RequestOptions from './request-options.ts'

const filterSchema = Schema.Struct({
  eventFields: Schema.Array(Schema.String),
})

describe('RequestOptions', () => {
  it.effect('encodes body keys as snake_case', () =>
    Effect.gen(function* () {
      const schema = Schema.Struct({
        userName: Schema.String,
        profile: Schema.Struct({ displayName: Schema.String }),
      })

      const body = yield* RequestOptions.encodeBody(RequestOptions.body(schema, { userName: 'alice', profile: { displayName: 'Alice' } }))

      expect(body._tag).toBe('Uint8Array')
      if (body._tag === 'Uint8Array') {
        expect(JSON.parse(new TextDecoder().decode(body.body))).toStrictEqual({
          user_name: 'alice',
          profile: { display_name: 'Alice' },
        })
      }
    }),
  )

  it.effect('encodes query keys and JSON-string values as snake_case', () =>
    Effect.gen(function* () {
      const schema = Schema.Struct({
        filter: Schema.optional(Schema.fromJsonString(filterSchema)),
        fullState: Schema.Boolean,
      })

      const query = yield* RequestOptions.encodeQuery(
        RequestOptions.query(schema, { filter: { eventFields: ['content.body'] }, fullState: true }),
      )

      expect(query).toStrictEqual({
        filter: '{"event_fields":["content.body"]}',
        full_state: true,
      })
    }),
  )

  it.effect('encodes Schema.fromJsonString path parameters before URI encoding', () =>
    Effect.gen(function* () {
      const endpoint = yield* makeEndpoint('GET', { auth: true, schema: Schema.Unknown })`/filters/${RequestOptions.path(
        Schema.fromJsonString(filterSchema),
        { eventFields: ['content.body'] },
      )}`

      expect(endpoint.path).toBe('/filters/%7B%22event_fields%22%3A%5B%22content.body%22%5D%7D')
    }),
  )
})

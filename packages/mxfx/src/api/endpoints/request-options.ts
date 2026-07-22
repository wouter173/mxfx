import { Effect, Schema } from 'effect'
import { HttpBody, type UrlParams } from 'effect/unstable/http'

import { encodeSnakeCaseSchema } from '../schema/encode-case.ts'

type RequestSchema = Schema.Top & Schema.Encoder<unknown, never>
type PathSchema = Schema.Top & Schema.Encoder<string | number, never>
type QuerySchema = Schema.Top & Schema.Encoder<UrlParams.Input, never>

export interface Body {
  readonly _tag: 'Body'
  readonly effect: Effect.Effect<HttpBody.HttpBody, HttpBody.HttpBodyError>
}

export interface Path {
  readonly _tag: 'Path'
  readonly effect: Effect.Effect<string, Schema.SchemaError>
}

export interface Query {
  readonly _tag: 'Query'
  readonly effect: Effect.Effect<UrlParams.Input, Schema.SchemaError>
}

export const body = <S extends RequestSchema>(schema: S, value: S['Type']): Body => ({
  _tag: 'Body',
  effect: HttpBody.jsonSchema(encodeSnakeCaseSchema(schema))(value),
})

export const path = <S extends PathSchema>(schema: S, value: S['Type']): Path => ({
  _tag: 'Path',
  effect: Schema.encodeEffect(encodeSnakeCaseSchema(schema))(value).pipe(Effect.map(String)),
})

export const query = <S extends QuerySchema>(schema: S, value: S['Type']): Query => ({
  _tag: 'Query',
  effect: Schema.encodeEffect(encodeSnakeCaseSchema(schema))(value).pipe(Effect.map(encoded => encoded as UrlParams.Input)),
})

export const isPath = (value: unknown): value is Path =>
  typeof value === 'object' && value !== null && '_tag' in value && value._tag === 'Path'

export const encodeBody = ({ effect }: Body) => effect

export const encodePath = ({ effect }: Path) => effect

export const encodeQuery = ({ effect }: Query) => effect

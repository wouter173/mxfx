import { Schema, String } from 'effect'

type CamelToSnake<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Tail extends Uncapitalize<Tail>
    ? `${Lowercase<Head>}${CamelToSnake<Tail>}`
    : `${Lowercase<Head>}_${CamelToSnake<Tail>}`
  : S

type SnakeCaseMapping<S extends Schema.Struct<any>> = {
  readonly [K in keyof S['fields']]: K extends string ? CamelToSnake<K> : K
}

type AnyStruct = Schema.Struct<Schema.Struct.Fields>
type AnyUnion = Schema.Union<ReadonlyArray<Schema.Top>>
type AnyArray = {
  readonly ast: { readonly _tag: 'Arrays' }
  readonly schema: Schema.Top
}
type AnyRecord = {
  readonly key: Schema.Record.Key
  readonly value: Schema.Top
}
type AnyWrapper = {
  readonly ast: { readonly _tag: string }
  readonly schema: Schema.Top
}
type AnyOptionalWrapper = AnyWrapper & {
  readonly schema: {
    readonly members: ReadonlyArray<Schema.Top>
  }
}

const isSchemaLike = (value: unknown): value is object | Function =>
  (typeof value === 'object' || typeof value === 'function') && value !== null

const isStructSchema = (value: unknown): value is AnyStruct => isSchemaLike(value) && 'fields' in value
const isUnionSchema = (value: unknown): value is AnyUnion => isSchemaLike(value) && 'members' in value && 'mapMembers' in value
const isArraySchema = (value: unknown): value is AnyArray =>
  isSchemaLike(value) && 'ast' in value && 'schema' in value && (value as AnyArray).ast._tag === 'Arrays'
const isRecordSchema = (value: unknown): value is AnyRecord =>
  isSchemaLike(value) && 'key' in value && 'value' in value && !('fields' in value)
const isOptionalWrapperSchema = (value: unknown): value is AnyOptionalWrapper =>
  isSchemaLike(value) &&
  'ast' in value &&
  'schema' in value &&
  (value as AnyWrapper).ast._tag === 'Union' &&
  !('members' in value && 'mapMembers' in value) &&
  typeof (value as AnyOptionalWrapper).schema === 'object' &&
  (value as AnyOptionalWrapper).schema !== null &&
  'members' in (value as AnyOptionalWrapper).schema &&
  (value as AnyOptionalWrapper).schema.members.some(member => member.ast._tag === 'Undefined')

const encodeSnakeCaseStruct = (schema: AnyStruct): Schema.Top => {
  const nestedFields = Object.fromEntries(
    Object.entries(schema.fields).map(([key, field]) => [key, encodeSnakeCaseSchemaInternal(field as Schema.Top)]),
  ) as Schema.Struct.Fields

  const nestedSchema = Schema.Struct(nestedFields)
  const mapping = Object.fromEntries(Object.keys(nestedSchema.fields).map(key => [key, String.camelToSnake(key)])) as SnakeCaseMapping<
    typeof nestedSchema
  >

  return nestedSchema.pipe(Schema.encodeKeys(mapping))
}

const encodeSnakeCaseSchemaInternal = (schema: Schema.Top): Schema.Top => {
  if (isStructSchema(schema)) {
    return encodeSnakeCaseStruct(schema)
  }

  if (isUnionSchema(schema)) {
    return schema.mapMembers(members => members.map((member: Schema.Top) => encodeSnakeCaseSchemaInternal(member)) as typeof members)
  }

  if (isArraySchema(schema)) {
    return Schema.Array(encodeSnakeCaseSchemaInternal(schema.schema))
  }

  if (isRecordSchema(schema)) {
    return Schema.Record(schema.key, encodeSnakeCaseSchemaInternal(schema.value))
  }

  if (isOptionalWrapperSchema(schema)) {
    const member = schema.schema.members.find(current => current.ast._tag !== 'Undefined')
    return member ? Schema.optional(encodeSnakeCaseSchemaInternal(member)) : schema
  }

  return schema
}

export const encodeSnakeCaseSchema = <S extends Schema.Top>(schema: S): S => encodeSnakeCaseSchemaInternal(schema) as S

export const encodeSnakeCaseKeys = <S extends Schema.Struct<any>>(schema: S) => {
  return encodeSnakeCaseSchema(schema) as unknown as Schema.decodeTo<S, Schema.Struct<any>>
}

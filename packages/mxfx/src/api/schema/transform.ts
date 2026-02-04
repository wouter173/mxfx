import { Schema } from 'effect'

export const nullable = <A, I>(s: Schema.Schema<A, I>) =>
  Schema.transform(Schema.NullishOr(s), Schema.Union(Schema.typeSchema(s), Schema.Undefined), {
    strict: true,
    decode: value => (value === null ? undefined : value),
    encode: value => value,
  })

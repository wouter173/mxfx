import { Schema } from 'effect'

const UserIdBrand: unique symbol = Symbol.for('mxfx/UserId')

//TODO: https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/SCHEMA.md#template-literals
const schema = Schema.String.pipe(
  Schema.maxLength(255),
  Schema.minLength(1),
  Schema.pattern(/^@([0-9a-z\-._=/+]+):([^\s:]+)$/),
  Schema.brand(UserIdBrand),
)
export type UserId = typeof schema.Type
export const UserId = {
  schema,
  make: Schema.decode(schema),
}

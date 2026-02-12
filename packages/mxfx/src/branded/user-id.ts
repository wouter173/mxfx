import { Schema } from 'effect'

const schema = Schema.String.pipe(
  Schema.maxLength(255),
  Schema.minLength(1),
  Schema.pattern(/^@([0-9a-z\-._=/+]+):([^\s:]+)$/),
  Schema.brand('mxfx/UserId'),
)
export type UserId = typeof schema.Type
export const UserId = {
  schema,
  make: Schema.decode(schema),
}

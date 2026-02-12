import { Schema } from 'effect'

const schema = Schema.String.pipe(Schema.pattern(/^mxc:\/\/[^\s/]+\/[^\s]+$/), Schema.brand('mxfx/MxcUri'))

export type MxcUri = typeof schema.Type
export const MxcUri = {
  schema,
  make: Schema.decode(schema),
}

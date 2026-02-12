import { Schema } from 'effect'

export const MxcUriBrand = Symbol.for('mxfx/MxcUri')
const schema = Schema.String.pipe(Schema.pattern(/^mxc:\/\/[^\s/]+\/[^\s]+$/), Schema.brand(MxcUriBrand))

export type MxcUri = typeof schema.Type
export const MxcUri = {
  schema,
  make: Schema.decode(schema),
}

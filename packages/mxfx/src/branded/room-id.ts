import { Schema } from 'effect'

export const RoomIdBrand: unique symbol = Symbol.for('mxfx/RoomId')
const schema = Schema.String.pipe(Schema.pattern(/^![A-Za-z0-9+/]+:([^\s:]+)$/), Schema.brand(RoomIdBrand))

export type RoomId = typeof schema.Type
export const RoomId = {
  schema,
  make: (id: string) => Schema.decode(schema)(id),
}

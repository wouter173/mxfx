import { Schema } from 'effect'

const schema = Schema.String.pipe(Schema.pattern(/^![A-Za-z0-9+/]+:([^\s:]+)$/), Schema.brand('mxfx/RoomId'))
export type RoomId = typeof schema.Type
export const RoomId = {
  schema,
  make: (id: string) => Schema.decode(schema)(id),
}

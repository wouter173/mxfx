import { Schema } from 'effect'

const schema = Schema.String.pipe(Schema.brand('mxfx/EventId'))

export type EventId = typeof schema.Type
export const EventId = {
  schema,
  make: Schema.decode(schema),
}

import { Schema } from 'effect'

export const EventIdBrand: unique symbol = Symbol.for('mxfx/EventId')
const schema = Schema.String.pipe(Schema.brand(EventIdBrand))

export type EventId = typeof schema.Type
export const EventId = { schema, make: Schema.decode(schema) }

import { Schema } from 'effect'

const schema = Schema.String.check(Schema.isMaxLength(255), Schema.isPattern(/^![^:]+(?::.+)?$/u)).pipe(Schema.brand('mxfx/RoomId'))

export type RoomId = typeof schema.Type
export const RoomId = { schema, make: Schema.decodeUnknownEffect(schema) }

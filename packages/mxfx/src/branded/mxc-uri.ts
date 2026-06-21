import { Schema } from 'effect'

const schema = Schema.TemplateLiteral(['mxc://', Schema.String]).pipe(Schema.brand('mxfx/MxcUri'))

export type MxcUri = typeof schema.Type
export const MxcUri = { schema, make: Schema.decodeUnknownEffect(schema) }

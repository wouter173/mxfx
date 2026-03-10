import { Schema } from 'effect'

import { opaqueId } from './opaque-id'
import { ServerName } from './server-name'

const schema = Schema.Union([Schema.TemplateLiteral(['#', opaqueId, ':', ServerName.schema])]).pipe(
  Schema.check(Schema.isMaxLength(255)),
  Schema.brand('mxfx/RoomAlias'),
)

export type RoomAlias = typeof schema.Type
export const RoomAlias = { schema, make: Schema.decodeUnknownEffect(schema) }

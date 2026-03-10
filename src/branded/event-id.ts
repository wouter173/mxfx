import { Schema } from 'effect'

import { opaqueId } from './opaque-id'
import { ServerName } from './server-name'

const schema = Schema.Union([
  Schema.TemplateLiteral(['$', opaqueId, ':', ServerName.schema]),
  Schema.TemplateLiteral(['$', opaqueId]),
]).pipe(Schema.check(Schema.isMaxLength(255)), Schema.brand('mxfx/EventId'))

export type EventId = typeof schema.Type
export const EventId = { schema, make: Schema.decodeUnknownEffect(schema) }

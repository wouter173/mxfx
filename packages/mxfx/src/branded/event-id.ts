import { Schema } from 'effect'
import { ServerName } from './server-name'
import { opaqueId } from './opaque-id'

const schema = Schema.Union([
  Schema.TemplateLiteral(['$', opaqueId, ':', ServerName.schema]),
  Schema.TemplateLiteral(['$', opaqueId]),
]).pipe(Schema.check(Schema.isMaxLength(255)), Schema.brand('mxfx/EventId'))

export type EventId = typeof schema.Type
export const EventId = { schema, make: Schema.decodeUnknownEffect(schema) }

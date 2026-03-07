import { Schema } from 'effect'
import { ServerName } from './server-name'
import { opaqueId } from './opaque-id'

const localpart = opaqueId.check(Schema.isPattern(/^[A-Za-z0-9]+$/))

const schema = Schema.Union([
  Schema.TemplateLiteral(['!', localpart, ':', ServerName.schema]),
  Schema.TemplateLiteral(['!', localpart]),
]).pipe(Schema.check(Schema.isMaxLength(255)), Schema.brand('mxfx/RoomId'))

export type RoomId = typeof schema.Type
export const RoomId = { schema, make: Schema.decodeUnknownEffect(schema) }

import { Schema } from 'effect'

import { ServerName } from './server-name'

const localpart = Schema.String.check(Schema.isMaxLength(255), Schema.isPattern(/^[A-Za-z0-9]+$/u))

const schema = Schema.Union([
  Schema.TemplateLiteral(['!', localpart, ':', ServerName.schema]),
  // Schema.TemplateLiteral(['!', localpart]), //TODO localpart only room ids are technically valid, but when adding this it causes that the servername is checked against the localpart regex as it does not pattern match correctly.
]).pipe(Schema.check(Schema.isMaxLength(255)), Schema.brand('mxfx/RoomId'))

export type RoomId = typeof schema.Type
export const RoomId = { schema, make: Schema.decodeUnknownEffect(schema) }

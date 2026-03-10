import { Schema } from 'effect'

import { opaqueId } from './opaque-id'
import { ServerName } from './server-name'

const localpart = opaqueId.check(Schema.isPattern(/^[a-z0-9._=\-/+]+$/))

const schema = Schema.TemplateLiteral(['@', localpart, ':', ServerName.schema]).pipe(
  Schema.check(Schema.isMaxLength(255)),
  Schema.brand('mxfx/UserId'),
)

export type UserId = typeof schema.Type
export const UserId = { schema, make: Schema.decodeUnknownEffect(schema) }

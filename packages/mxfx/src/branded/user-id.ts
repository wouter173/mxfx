import { Schema } from 'effect'

import { opaqueId } from './opaque-id.ts'
import { ServerName } from './server-name.ts'

const localpart = opaqueId.check(Schema.isPattern(/^[a-z0-9._=\-/+]+$/))

/**
 * User IDs received from Matrix servers may use the historical, opaque localpart
 * grammar. Homeservers must continue accepting these IDs even though they may not
 * create new IDs using that grammar.
 */
const schema = Schema.TemplateLiteral(['@', opaqueId, ':', ServerName.schema]).pipe(
  Schema.check(Schema.isMaxLength(255)),
  Schema.brand('mxfx/UserId'),
)

/** The modern grammar used when constructing a new user ID in mxfx. */
const creationSchema = Schema.TemplateLiteral(['@', localpart, ':', ServerName.schema]).pipe(
  Schema.check(Schema.isMaxLength(255)),
  Schema.brand('mxfx/UserId'),
)

export type UserId = typeof schema.Type
export const UserId = {
  schema,
  creationSchema,
  make: Schema.decodeUnknownEffect(creationSchema),
}

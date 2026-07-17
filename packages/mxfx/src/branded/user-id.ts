import { Schema } from 'effect'

import { opaqueId } from './opaque-id.ts'
import { ServerName } from './server-name.ts'

const localpart = opaqueId.check(Schema.isPattern(/^[a-z0-9._=\-/+]+$/))
const historicalLocalpart = Schema.String.check(
  Schema.isPattern(/^[^:\uD800-\uDFFF]*$/u),
  Schema.makeFilter((input: string) => !input.includes('\u0000'), { expected: 'a localpart without a NUL character' }),
)
const utf8Encoder = new TextEncoder()
const isValidUserIdByteLength = Schema.makeFilter((input: string) => utf8Encoder.encode(input).byteLength <= 255, {
  expected: 'a user ID at most 255 bytes long when encoded as UTF-8',
})

/**
 * User IDs received from Matrix servers may use the historical, opaque localpart
 * grammar. Homeservers must continue accepting these IDs even though they may not
 * create new IDs using that grammar.
 */
const schema = Schema.TemplateLiteral(['@', historicalLocalpart, ':', ServerName.schema]).pipe(
  Schema.check(isValidUserIdByteLength),
  Schema.brand('mxfx/UserId'),
)

/** The modern grammar used when constructing a new user ID in mxfx. */
const creationSchema = Schema.TemplateLiteral(['@', localpart, ':', ServerName.schema]).pipe(
  Schema.check(isValidUserIdByteLength),
  Schema.brand('mxfx/UserId'),
)

export type UserId = typeof schema.Type
export const UserId = {
  schema,
  creationSchema,
  make: Schema.decodeUnknownEffect(creationSchema),
}

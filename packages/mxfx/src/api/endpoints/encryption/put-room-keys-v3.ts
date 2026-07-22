import { Effect, Schema } from 'effect'
import { HttpBody } from 'effect/unstable/http'

import { RoomId } from '../../../branded/room-id.ts'
import { encodeSnakeCaseSchema } from '../../schema/encode-case.ts'
import { makeEndpoint } from '../endpoint.ts'

const keyBackupDataSchema = Schema.Struct({
  firstMessageIndex: Schema.Number,
  forwardedCount: Schema.Number,
  isVerified: Schema.Boolean,
  sessionData: Schema.Unknown,
})

const roomKeyBackupSchema = Schema.Struct({
  sessions: Schema.Record(Schema.String, keyBackupDataSchema),
})

const optionsSchema = Schema.Struct({
  version: Schema.String,
  body: Schema.Union([Schema.Struct({ rooms: Schema.Record(RoomId.schema, roomKeyBackupSchema) }), Schema.String]),
})

const schema = Schema.Struct({
  count: Schema.Number,
  etag: Schema.String,
})

/**
 * `PUT /_matrix/client/v3/room_keys/keys`
 *
 * @description
 * Store several keys in the backup.
 *
 * @see https://spec.matrix.org/unstable/client-server-api/#put_matrixclientv3room_keyskeys
 */
export const putRoomKeysV3 = Effect.fn(function* (options: typeof optionsSchema.Type) {
  const body = yield* optionsSchema.makeEffect(options).pipe(
    Effect.andThen(Schema.encodeUnknownEffect(optionsSchema.pipe(encodeSnakeCaseSchema))),
    Effect.andThen(({ body }) =>
      typeof body === 'string' ? Effect.succeed(HttpBody.text(body, 'application/json')) : HttpBody.json(body),
    ),
  )

  return yield* makeEndpoint('PUT', { auth: true, schema, body, params: { version: options.version } })`/v3/room_keys/keys`
})

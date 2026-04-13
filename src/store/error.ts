import { Data } from 'effect'
import type { SqlError } from 'effect/unstable/sql/SqlError'

export class DecodingError extends Data.TaggedError('mxfx/store/decoding-error')<{
  cause?: unknown
  message?: string
}> {}

export class StoreError extends Data.TaggedError('mxfx/store/error')<{
  reason?: DecodingError | SqlError
  message?: string
}> {}

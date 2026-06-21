import { Data } from 'effect'

export class AuthError extends Data.TaggedError('mxfx/AuthError')<{
  readonly message: string
  readonly cause?: unknown
}> {}

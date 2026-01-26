import { Data } from 'effect'

export class AuthInvalidHomeServerUrlError extends Data.TaggedError('mxfx/AuthInvalidHomeServerUrl')<{ url: string; cause?: Error }> {}
export class AuthUnsupportedLoginFlowsError extends Data.TaggedError('mxfx/AuthUnsupportedLoginFlows')<{
  message?: string
  cause?: Error
}> {}
export class AuthSSOCancelledError extends Data.TaggedError('mxfx/AuthSSOCancelled')<{ cause?: Error }> {}
export class AuthCallbackUrlMissingTokenError extends Data.TaggedError('mxfx/AuthCallbackUrlMissingToken')<{
  url: string
  cause?: Error
}> {}

import { Data } from 'effect'

import type { MatrixApiErrorContent } from './schema/error'

export class ApiHttpError extends Data.TaggedError('mxfx/ApiHttpError')<{
  url: string
  method: string
  params?: unknown
  body?: unknown
  status: number
  content?: MatrixApiErrorContent
  cause?: Error
}> {
  override message: string = JSON.stringify(this)
}

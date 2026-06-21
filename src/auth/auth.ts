import { Context } from 'effect'
import type { Effect } from 'effect/Effect'

import type { AuthError } from './error'

export class MatrixAuth extends Context.Service<
  MatrixAuth,
  {
    getAccessToken: () => Effect<{ token: string }, AuthError>
    // getRefreshToken: () => Effect<{ token: string }, AuthError>
  }
>()('mxfx/auth') {}

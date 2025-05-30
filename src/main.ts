import { Cause, Effect, Exit } from 'effect'

class HttpError {
  readonly _tag = 'HttpError'
}

const program = Effect.gen(function* () {
  const text = yield* Effect.succeed('Hello, world!')
  const length = yield* Effect.succeed(text.length)
  yield* Effect.fail(new HttpError())

  yield* Effect.log(text, `The length of the text is: ${length}`, Cause.die('hi'))

  return length
})

const x = Effect.runSync(program)

console.log(x)

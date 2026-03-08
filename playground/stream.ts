import { Effect, Result, Stream } from 'effect'

// const program = Stream.make(1, 2, 3, null, undefined).pipe(
//   // Stream.map(x => x * 2),

//   Stream.filterMap(x => Result.fromNullishOr(x, () => 'x')), // Only allow 4 to pass through
//   Stream.runForEach(x => Effect.log(`Value: ${x}`)),
// )

// console.log(await Effect.runPromiseExit(program))

const program2 = Stream.make([1, 2], [3, null], [undefined]).pipe(
  Stream.flatMap(x => Stream.fromIterable(x)),

  Stream.filterMap(x => Result.fromNullishOr(x, () => 'x')), // Only allow 4 to pass through
  Stream.runForEach(x => Effect.log(`Value: ${x}`)),
)

console.log(await Effect.runPromiseExit(program2))

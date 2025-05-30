import { Effect } from 'effect'
import { Registry } from '../discord/registry'
import type { Message } from 'discord.js'

export class PingCommand extends Effect.Service<PingCommand>()('duckhunt/ping-command', {
  effect: Effect.gen(function* () {
    yield* Effect.logInfo('Registering ping command...')
    const registry = yield* Registry

    yield* registry.register('--ping', {
      run: (msg: Message) =>
        Effect.gen(function* () {
          yield* Effect.logInfo(`Received ping command from ${msg.author.tag}`)

          yield* Effect.tryPromise({
            try: async () => await msg.reply('Pong!'),
            catch: e => Effect.fail(new Error(`Failed to reply: ${e}`)),
          })
        }).pipe(Effect.catchAll(e => Effect.logError(`Error in ping command: ${e}`))),
    })

    return {}
  }),
}) {}

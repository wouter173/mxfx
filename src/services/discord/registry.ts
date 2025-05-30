import type { Message } from 'discord.js'
import { Data, Effect } from 'effect'

class RegistryNotFoundError extends Data.TaggedError('duckhunt/registry-error')<{ command?: string }> {}

type Command = {
  run: (msg: Message) => Effect.Effect<void, never, never>
}

const commands: Record<string, Command> = {}

export class Registry extends Effect.Service<Registry>()('duckhunt/registry', {
  effect: Effect.gen(function* () {
    const register = (name: string, command: Command) =>
      Effect.gen(function* () {
        commands[name] = command
      })

    const runCommand = (name: string, msg: Message) =>
      Effect.gen(function* () {
        const command = commands[name]
        if (!command) {
          return yield* Effect.fail(new RegistryNotFoundError({ command: name }))
        }
        return yield* command.run(msg)
      })

    const getCommands = () => Effect.succeed(Object.keys(commands))
    return { register, runCommand, getCommands }
  }),
  dependencies: [],
}) {}

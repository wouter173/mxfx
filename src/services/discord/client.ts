import { Chunk, Config, Context, Data, Effect, Layer, Stream } from 'effect'
import { Client as DiscordClient, IntentsBitField, Message } from 'discord.js'
import { Registry } from './registry'

type ConstructorArgs<T extends new (...args: any) => any> = T extends new (...args: infer A) => infer _R ? A : never

export class DiscordClientError extends Data.TaggedError('DiscordClientError')<{
  cause?: unknown
  message?: string
}> {}

class DiscordHandlerError extends Data.TaggedError('DiscordHandlerError')<{ cause?: unknown; message?: string }> {}

interface DiscordImpl {
  use: <T>(fn: (client: DiscordClient) => T) => Effect.Effect<Awaited<T>, DiscordClientError, never>
}
export class Client extends Context.Tag('duckhunt/discord')<Client, DiscordImpl>() {}

export const make = (options: ConstructorArgs<typeof DiscordClient>[0]) =>
  Effect.gen(function* () {
    const client = yield* Effect.try({
      try: () => new DiscordClient(options),
      catch: e => new DiscordClientError({ cause: e }),
    })
    return Client.of({
      use: fn =>
        Effect.gen(function* () {
          const result = yield* Effect.try({
            try: () => fn(client),
            catch: e => new DiscordClientError({ cause: e, message: 'Synchronous error in `Discord.use`' }),
          })
          if (result instanceof Promise) {
            return yield* Effect.tryPromise({
              try: () => result,
              catch: e => new DiscordClientError({ cause: e, message: 'Asynchronous error in `Discord.use`' }),
            })
          } else {
            return result
          }
        }),
    })
  })

export const layer = (options: ConstructorArgs<typeof DiscordClient>[0]) => Layer.scoped(Client, make(options))

const intents = [
  IntentsBitField.Flags.Guilds,
  IntentsBitField.Flags.GuildMembers,
  IntentsBitField.Flags.GuildMessages,
  IntentsBitField.Flags.MessageContent,
]

export const Default = Layer.scoped(Client, make({ intents }))

export const fromEnv = Layer.scoped(
  Client,
  Effect.gen(function* () {
    const token = yield* Config.string('TOKEN')
    const client = yield* make({ intents })
    const registry = yield* Registry

    yield* client.use(
      client =>
        new Promise(resolve => {
          client.once('ready', resolve)
          client.login(token)
        }),
    )

    const commands = yield* registry.getCommands()

    const messageCreateHandler = (message: Message) =>
      Effect.gen(function* () {
        if (commands.includes(message.content)) {
          yield* registry
            .runCommand(message.content, message)
            .pipe(Effect.catchAll(e => Effect.logError(`Error running command "${message.content}": ${e}`)))
        }
      })

    const messageStream = yield* client.use(client =>
      Stream.async<Message>(emit => {
        client.on('messageCreate', (message: Message) => emit(Effect.succeed(Chunk.of(message))))
      }),
    )

    yield* Effect.logInfo('Registered commands:', { commands })
    yield* Effect.logInfo('Listening for messages...')
    yield* messageStream.pipe(
      Stream.tap(message => Effect.logInfo('Reading message: ', message.content)),
      Stream.tap(message => messageCreateHandler(message)),
      Stream.runDrain,
    )

    return client
  }),
)

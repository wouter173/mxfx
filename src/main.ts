import { Layer, pipe } from 'effect'

import { NodeRuntime } from '@effect/platform-node'
import * as DiscordClient from './services/discord/client'
import { Registry } from './services/discord/registry'
import { PingCommand } from './services/commands/ping'

const layers = Layer.mergeAll(DiscordClient.fromEnv, PingCommand.Default).pipe(Layer.provide(Registry.Default))
pipe(Layer.launch(layers), NodeRuntime.runMain)

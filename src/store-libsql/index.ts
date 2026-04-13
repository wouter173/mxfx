import { Layer } from 'effect'

import { roomTimelineRepositoryLibSQLLive } from './repository/room-repository'
import { transactionProviderLibSQLLive } from './transaction'

export const layerLibSQLLive = Layer.mergeAll(
  roomTimelineRepositoryLibSQLLive, //
  transactionProviderLibSQLLive,
)

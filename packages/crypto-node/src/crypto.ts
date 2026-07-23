//TODO: move this to core mxfx package
import * as MatrixCryptoNode from '@matrix-org/matrix-sdk-crypto-nodejs'
import { Context, Data, Effect, Redacted, Scope } from 'effect'
import type { MatrixApi, RoomId } from 'mxfx'

type SyncFrame = typeof MatrixApi.endpoints.getSyncV3ResponseSchema.Type

export class CryptoError extends Data.TaggedError('mxfx/crypto/error')<{
  readonly message?: string
  readonly cause?: unknown
}> {}

export type Machine = {
  //TODO: When moving to core use a generic olmmachine here (if possible)
  _olmMachine: MatrixCryptoNode.OlmMachine
}

export type MachineOptions = {
  userId: string
  deviceId: string
  storage: { type: 'memory' } | { type: 'sqlite'; path: string; passphrase: Redacted.Redacted<string> }
}

export type CryptoShape = {
  //TODO: use mxfx branded userid, figure out dependency graph
  makeMachine: ({ userId, deviceId, storage }: MachineOptions) => Effect.Effect<Machine, CryptoError, Scope.Scope>
  receiveSyncChanges: (machine: Machine, sync: SyncFrame) => Effect.Effect<void, CryptoError>
  getOutgoingRequests: (machine: Machine) => Effect.Effect<
    Array<{
      endpoint: MatrixApi.endpoints.MatrixEndpoint
      requestType: MatrixCryptoNode.RequestType
      requestId: string
    }>,
    CryptoError
  >
  sendOutgoingRequests: (machine: Machine) => Effect.Effect<void, CryptoError>
  markRequestAsSent: (
    machine: Machine,
    requestId: string,
    requestType: MatrixCryptoNode.RequestType,
    response: string,
  ) => Effect.Effect<void, CryptoError>
  decryptRoomEvent: (machine: Machine, event: string, roomId: RoomId) => Effect.Effect<MatrixCryptoNode.DecryptedRoomEvent, CryptoError> //TODO: don't expose MatrixCryptoNode.DecryptedRoomEvent
}

export class Crypto extends Context.Service<Crypto, CryptoShape>()('mxfx/crypto') {}

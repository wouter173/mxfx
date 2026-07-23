import * as MatrixCryptoNode from '@matrix-org/matrix-sdk-crypto-nodejs'
import { Effect, Layer, Redacted } from 'effect'
import { MatrixApi, RoomId } from 'mxfx'

import { Crypto, CryptoError, type Machine, type CryptoShape, type MachineOptions } from './crypto.ts'

type SyncFrame = typeof MatrixApi.endpoints.getSyncV3ResponseSchema.Type

export const makeLayer: Effect.Effect<CryptoShape, never, MatrixApi.MatrixApi> = Effect.gen(function* () {
  const api = yield* MatrixApi.MatrixApi

  const acquireMachine = Effect.fn(function* ({ userId, deviceId, storage }: MachineOptions) {
    const olmMachine = yield* Effect.tryPromise({
      try: () =>
        MatrixCryptoNode.OlmMachine.initialize(
          new MatrixCryptoNode.UserId(userId),
          new MatrixCryptoNode.DeviceId(deviceId),
          storage.type === 'sqlite' ? storage.path : undefined,
          storage.type === 'sqlite' ? Redacted.value(storage.passphrase) : undefined,
        ),

      catch: cause => new CryptoError({ cause }),
    })

    return { _olmMachine: olmMachine }
  })

  const closeMachine = (machine: Machine) =>
    Effect.try({
      try: () => machine._olmMachine.close(),
      catch: e => new CryptoError({ cause: e }),
    })

  const makeMachine = (options: MachineOptions) =>
    Effect.acquireRelease(acquireMachine(options), machine =>
      closeMachine(machine).pipe(Effect.catch(error => Effect.logError('Failed to close OlmMachine', error))),
    )

  const receiveSyncChanges = Effect.fn(function* (machine: Machine, sync: SyncFrame) {
    //TODO: all this can fail, probably
    const toDeviceEvents = JSON.stringify(sync.toDevice?.events ?? [])

    const changedUsers = (sync.deviceLists?.changed ?? []).map(userId => new MatrixCryptoNode.UserId(userId))
    const leftUsers = (sync.deviceLists?.left ?? []).map(userId => new MatrixCryptoNode.UserId(userId))
    const changedDevices = new MatrixCryptoNode.DeviceLists(changedUsers, leftUsers)

    const oneTimeKeyCounts = sync.deviceOneTimeKeysCount ?? {}
    const unusedFallbackKeys = [...(sync.deviceUnusedFallbackKeyTypes ?? [])] //TODO: this copy a lil crazy but otherwise it readonly

    const toDevice = yield* Effect.tryPromise({
      try: () => machine._olmMachine.receiveSyncChanges(toDeviceEvents, changedDevices, oneTimeKeyCounts, unusedFallbackKeys),
      catch: cause => new CryptoError({ cause }),
    })

    return toDevice
  })

  const getOutgoingRequests = Effect.fn(function* (machine: Machine) {
    const outgoingRequests = yield* Effect.tryPromise({
      try: () => machine._olmMachine.outgoingRequests(),
      catch: cause => new CryptoError({ cause }),
    })

    return yield* Effect.forEach(outgoingRequests, request =>
      Effect.gen(function* () {
        if (request.type === MatrixCryptoNode.RequestType.KeysUpload) {
          return { endpoint: yield* MatrixApi.endpoints.postKeysUploadV3(request.body), requestId: request.id, requestType: request.type }
        } else if (request.type === MatrixCryptoNode.RequestType.KeysClaim) {
          return { endpoint: yield* MatrixApi.endpoints.postKeysClaimV3(request.body), requestId: request.id, requestType: request.type }
        } else if (request.type === MatrixCryptoNode.RequestType.KeysQuery) {
          return { endpoint: yield* MatrixApi.endpoints.postKeysQueryV3(request.body), requestId: request.id, requestType: request.type }
        } else if (request.type === MatrixCryptoNode.RequestType.SignatureUpload) {
          const endpoint = yield* MatrixApi.endpoints.postKeysSignaturesUploadV3(request.body)
          return { endpoint, requestId: request.id, requestType: request.type }
        } else if (request.type === MatrixCryptoNode.RequestType.ToDevice) {
          const toDevice = request as MatrixCryptoNode.ToDeviceRequest
          const endpoint = yield* MatrixApi.endpoints.putSendToDeviceV3({
            body: toDevice.body,
            eventType: toDevice.eventType,
            transactionId: toDevice.txnId,
          })
          return { endpoint, requestId: request.id, requestType: request.type }
        } else if (request.type === MatrixCryptoNode.RequestType.RoomMessage) {
          const roomMessage = request as MatrixCryptoNode.RoomMessageRequest
          const endpoint = yield* MatrixApi.endpoints.putRoomsSendV3({
            content: request.body,
            eventType: roomMessage.eventType,
            roomId: yield* RoomId.make(roomMessage.roomId),
          })
          return { endpoint, requestId: request.id, requestType: request.type }
        } else if (request.type === MatrixCryptoNode.RequestType.KeysBackup) {
          const backupVersion = yield* Effect.tryPromise({
            try: () => machine._olmMachine.getBackupKeys(),
            catch: cause => new CryptoError({ cause }),
          }).pipe(
            Effect.map(x => x.backupVersion),
            Effect.flatMap(Effect.fromNullishOr),
          )

          const endpoint = yield* MatrixApi.endpoints.putRoomKeysV3({ body: request.body, version: backupVersion })
          return { endpoint, requestId: request.id, requestType: request.type }
        } else {
          return yield* Effect.fail(new CryptoError({ message: `Unknown MatrixCryptoNode.RequestType ${request.type}` }))
        }
      }),
    ).pipe(Effect.mapError(cause => new CryptoError({ cause })))
  })

  const markRequestAsSent = Effect.fn(function* (
    machine: Machine,
    requestId: string,
    requestType: MatrixCryptoNode.RequestType,
    response: string,
  ) {
    yield* Effect.tryPromise({
      try: () => machine._olmMachine.markRequestAsSent(requestId, requestType, response),
      catch: cause => new CryptoError({ cause }),
    })
  })

  const sendOutgoingRequests = Effect.fn(function* (machine: Machine) {
    const outgoingRequests = yield* getOutgoingRequests(machine)

    yield* Effect.forEach(
      outgoingRequests,
      outgoing =>
        api.executeRaw(outgoing.endpoint).pipe(
          Effect.mapError(cause => new CryptoError({ cause })),
          Effect.andThen(json => markRequestAsSent(machine, outgoing.requestId, outgoing.requestType, json)),
        ),
      { concurrency: 1 },
    )
  })

  const decryptRoomEvent = Effect.fn(function* (machine: Machine, event: string, roomId: RoomId) {
    const decryptedEvent = yield* Effect.tryPromise({
      try: () => machine._olmMachine.decryptRoomEvent(event, new MatrixCryptoNode.RoomId(roomId)),
      catch: cause => new CryptoError({ cause }),
    })

    return decryptedEvent
  })

  return { makeMachine, receiveSyncChanges, getOutgoingRequests, sendOutgoingRequests, markRequestAsSent, decryptRoomEvent }
})

export const layer = Layer.effect(Crypto, makeLayer)

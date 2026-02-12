import { Effect, Schema, SubscriptionRef } from 'effect'
import { ClientEventWithoutRoomIdSchema, RoomMessageEventPartialSchema } from '../api/schema/common'
import type { MxcUri, RoomId } from '../branded'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const RoomMessageEvent = Schema.Struct({
  ...ClientEventWithoutRoomIdSchema.fields,
  ...RoomMessageEventPartialSchema.fields,
})

export type Message = Schema.Schema.Type<typeof RoomMessageEvent>

export type Store = {
  user: {
    id: string
    displayName?: string
    avatarUrl?: MxcUri
  } | null
  rooms: Record<
    RoomId,
    {
      name?: string
      messages: Array<Message>
      lastBatchId?: string
    }
  >
  cache: {
    mxcServerMap: Record<string, { baseUrl: string; expiresAt: number }>
  }
}

const DEFAULT_STORE: Store = {
  user: null,
  rooms: {},
  cache: { mxcServerMap: {} },
}

export class MatrixClientStore extends Effect.Service<MatrixClientStore>()('mxfx/MatrixClientStore', {
  effect: Effect.gen(function* () {
    yield* Effect.log('MatrixClientStore initialized')

    const storeRef = yield* SubscriptionRef.make<Store>(DEFAULT_STORE)

    const reset = () => SubscriptionRef.set(storeRef, DEFAULT_STORE)
    const get = () => SubscriptionRef.get(storeRef)

    // const updateRooms = ([]) => Effect.gen(function* () {})

    return { ref: storeRef, reset, get }
  }),
}) {}

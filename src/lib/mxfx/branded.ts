import { Schema } from 'effect'

export const RoomIdSchema = Schema.String.pipe(Schema.pattern(/^![A-Za-z0-9+/]+:([^\s:]+)$/), Schema.brand('mxfx/RoomId'))
export const RoomId = (id: string) => Schema.decode(RoomIdSchema)(id)
export type RoomIdType = typeof RoomIdSchema.Type

export const EventIdSchema = Schema.String.pipe(Schema.brand('mxfx/EventId'))
export const EventId = Schema.decode(EventIdSchema)
export type EventIdType = typeof EventIdSchema.Type

export const UserIdSchema = Schema.String.pipe(
  Schema.maxLength(255),
  Schema.minLength(1),
  Schema.pattern(/^@([0-9a-z\-._=/+]+):([^\s:]+)$/),
  Schema.brand('mxfx/UserId'),
)
export const UserId = (id: string) => Schema.decode(UserIdSchema)(id)
export type UserIdType = typeof UserIdSchema.Type

export const MxcUriSchema = Schema.String.pipe(Schema.pattern(/^mxc:\/\/[^\s/]+\/[^\s]+$/), Schema.brand('mxfx/MxcUri'))
export const MxcUri = (uri: string) => Schema.decode(MxcUriSchema)(uri)
export type MxcUriType = typeof MxcUriSchema.Type

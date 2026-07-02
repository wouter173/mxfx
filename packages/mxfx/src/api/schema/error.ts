import { Schema } from 'effect'

export const BaseErrorSchema = Schema.Struct({
  errcode: Schema.String,
  error: Schema.String,
})

export const ForbiddenErrorSchema = Schema.Struct({
  ...BaseErrorSchema.fields,
  errcode: Schema.Literal('M_FORBIDDEN'),
})

export const UnknownTokenErrorSchema = Schema.Struct({
  ...BaseErrorSchema.fields,
  errcode: Schema.Literal('M_UNKNOWN_TOKEN'),
  soft_logout: Schema.optional(Schema.Boolean),
})

export const MissingTokenErrorSchema = Schema.Struct({
  ...BaseErrorSchema.fields,
  errcode: Schema.Literal('M_MISSING_TOKEN'),
})

export const UserLockedErrorSchema = Schema.Struct({
  ...BaseErrorSchema.fields,
  errcode: Schema.Literal('M_USER_LOCKED'),
})

export const UserSuspendedErrorSchema = Schema.Struct({
  ...BaseErrorSchema.fields,
  errcode: Schema.Literal('M_USER_SUSPENDED'),
})

export const BadJsonErrorSchema = Schema.Struct({
  ...BaseErrorSchema.fields,
  errcode: Schema.Literal('M_BAD_JSON'),
})

export const NotJsonErrorSchema = Schema.Struct({
  ...BaseErrorSchema.fields,
  errcode: Schema.Literal('M_NOT_JSON'),
})

export const NotFoundErrorSchema = Schema.Struct({
  ...BaseErrorSchema.fields,
  errcode: Schema.Literal('M_NOT_FOUND'),
})

export const LimitExceededErrorSchema = Schema.Struct({
  ...BaseErrorSchema.fields,
  errcode: Schema.Literal('M_LIMIT_EXCEEDED'),
})

export const UnrecognizedErrorSchema = Schema.Struct({
  ...BaseErrorSchema.fields,
  errcode: Schema.Literal('M_UNRECOGNIZED'),
})

export const UnknownErrorSchema = Schema.Struct({
  ...BaseErrorSchema.fields,
  errcode: Schema.Literal('M_UNKNOWN'),
})

export const MatrixApiErrorContentSchema = Schema.Union([
  ForbiddenErrorSchema,
  UnknownTokenErrorSchema,
  MissingTokenErrorSchema,
  UserLockedErrorSchema,
  UserSuspendedErrorSchema,
  BadJsonErrorSchema,
  NotJsonErrorSchema,
  NotFoundErrorSchema,
  LimitExceededErrorSchema,
  UnrecognizedErrorSchema,
  UnknownErrorSchema,
])

export type MatrixApiErrorContent = typeof MatrixApiErrorContentSchema.Type

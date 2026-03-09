import { Schema } from 'effect'

export const opaqueId = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(255), Schema.isPattern(/^[^\u0000:]+$/u))

import { Schema } from 'effect'

/* eslint-disable no-control-regex */
export const opaqueId = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(255), Schema.isPattern(/^[^\u0000:]+$/u))

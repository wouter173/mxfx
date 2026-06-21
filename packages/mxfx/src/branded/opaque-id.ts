import { Schema } from 'effect'

//TODO: https://x.com/kitlangton/status/2032652945410367920/photo/1

/* eslint-disable no-control-regex */
export const opaqueId = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(255), Schema.isPattern(/^[^\u0000:]+$/u))

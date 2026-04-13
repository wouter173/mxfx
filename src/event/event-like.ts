export type Event = {
  readonly type: string
  readonly content?: unknown
  readonly [key: string]: unknown
}

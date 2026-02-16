import { HttpBody, HttpClientRequest, HttpClientResponse, UrlParams } from '@effect/platform'
import { Effect, ParseResult, Schema } from 'effect'
import type { ParseError } from 'effect/ParseResult'

export type MatrixEndpoint<A = void, I = unknown, R = never> = {
  path: string
  auth: boolean
  params?: UrlParams.Input
  schema: Schema.Schema<A, I, R>
} & (
  | { method: 'GET'; body?: undefined }
  | {
      method: 'POST' | 'PUT' | 'DELETE' | 'PATCH'
      body?: HttpBody.HttpBody
    }
)

export const makeEndpoint = <A, I, R>(endpoint: MatrixEndpoint<A, I, R>) => Effect.succeed(endpoint)

export const makeHttpRequest = <A, I, R>(endpoint: MatrixEndpoint<A, I, R>) =>
  Effect.gen(function* () {
    return HttpClientRequest.make(endpoint.method)(endpoint.path, {
      body: endpoint.body ? endpoint.body : HttpBody.empty,
      urlParams: endpoint.params ? endpoint.params : UrlParams.empty,
    })
  })

export const parseHttpResponse = <A, I, R>(endpoint: MatrixEndpoint<A, I, R>) =>
  HttpClientResponse.schemaBodyJson(endpoint.schema || Schema.Unknown)

import { HttpBody, HttpClientRequest, HttpClientResponse, UrlParams } from '@effect/platform'
import { Effect, ParseResult, Schema } from 'effect'

export type MatrixEndpoint<A = void, I = unknown, R = never> = {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  auth: boolean
  body?: Effect.Effect<HttpBody.HttpBody, HttpBody.HttpBodyError | ParseResult.ParseError>
  params?: UrlParams.Input
  schema: Schema.Schema<A, I, R>
}

export const makeEndpoint = <A, I, R>(endpoint: MatrixEndpoint<A, I, R>) => endpoint

export const makeHttpRequest = <A, I, R>(endpoint: MatrixEndpoint<A, I, R>) =>
  Effect.gen(function* () {
    return HttpClientRequest.make(endpoint.method)(endpoint.path, {
      body: endpoint.body ? yield* endpoint.body : HttpBody.empty,
      urlParams: endpoint.params ?? UrlParams.empty,
    })
  })

export const parseHttpResponse = <A, I, R>(endpoint: MatrixEndpoint<A, I, R>) =>
  HttpClientResponse.schemaBodyJson(endpoint.schema || Schema.Unknown)

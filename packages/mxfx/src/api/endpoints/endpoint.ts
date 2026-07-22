import { Effect, Schema } from 'effect'
import { HttpBody, HttpClientRequest, HttpClientResponse, UrlParams } from 'effect/unstable/http'

import { encodeSnakeCaseSchema } from '../schema/encode-case.ts'
import * as RequestOptions from './request-options.ts'

export type MatrixEndpoint<S extends Schema.Top> = {
  path: typeof pathBrandSchema.Type
  auth: boolean
  params?: UrlParams.Input
  schema: S
} & (
  | { method: 'GET'; body?: undefined }
  | {
      method: 'POST' | 'PUT' | 'DELETE' | 'PATCH'
      body?: HttpBody.HttpBody
    }
)

const makeEndpointFromConfig = <S extends Schema.Top>(endpoint: MatrixEndpoint<S>) => Effect.succeed(endpoint)

type PathValue = string | number

type EndpointBuilder<S extends Schema.Top> = (
  strings: TemplateStringsArray,
  ...values: readonly (PathValue | RequestOptions.Path)[]
) => Effect.Effect<MatrixEndpoint<S>, HttpBody.HttpBodyError | Schema.SchemaError>

type EndpointBaseOptions<S extends Schema.Top> = {
  schema: S
  query?: RequestOptions.Query
  encode?: boolean
}

type EndpointWithBodyOptions<S extends Schema.Top> = EndpointBaseOptions<S> & {
  auth: boolean
  body?: RequestOptions.Body
}

type GetOptions<S extends Schema.Top> = EndpointBaseOptions<S> & { auth: boolean }
type WriteOptions<S extends Schema.Top> = EndpointWithBodyOptions<S>

export function makeEndpoint<S extends Schema.Top>(method: 'GET', options: GetOptions<S>): EndpointBuilder<S>
export function makeEndpoint<S extends Schema.Top>(
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  options: WriteOptions<S>,
): EndpointBuilder<S>
export function makeEndpoint<S extends Schema.Top>(method: MatrixEndpoint<S>['method'], options: GetOptions<S> | WriteOptions<S>) {
  return make(method, options)
}

const make = <S extends Schema.Top>(method: MatrixEndpoint<S>['method'], options: GetOptions<S> | WriteOptions<S>) => {
  const encode = options.encode ?? true

  return (strings: TemplateStringsArray, ...values: readonly (PathValue | RequestOptions.Path)[]) => {
    const path = Effect.all(
      values.map(value => (RequestOptions.isPath(value) ? RequestOptions.encodePath(value) : Effect.succeed(String(value)))),
    ).pipe(Effect.map(values => apiPath({ encode })(strings, ...values)))
    const params = options.query ? RequestOptions.encodeQuery(options.query) : Effect.succeed(UrlParams.empty)
    const body =
      method !== 'GET' && 'body' in options && options.body ? RequestOptions.encodeBody(options.body) : Effect.succeed(HttpBody.empty)

    return Effect.all({ body, params, path }).pipe(
      Effect.flatMap(({ body, params, path }) =>
        makeEndpointFromConfig({
          auth: options.auth,
          method,
          path,
          params,
          schema: options.schema,
          body: method === 'GET' ? undefined : body,
        } as MatrixEndpoint<S>),
      ),
    )
  }
}

export const makeHttpRequest = <S extends Schema.Top>(endpoint: MatrixEndpoint<S>) =>
  Effect.succeed(
    HttpClientRequest.make(endpoint.method)(endpoint.path, {
      body: endpoint.body ? endpoint.body : HttpBody.empty,
      urlParams: endpoint.params ? endpoint.params : UrlParams.empty,
    }),
  )

export const parseHttpResponse = <S extends Schema.Top>(endpoint: MatrixEndpoint<S>) =>
  HttpClientResponse.schemaBodyJson(endpoint.schema.pipe(encodeSnakeCaseSchema), {
    onExcessProperty: 'preserve',
  })

export const pathBrandSchema = Schema.String.pipe(Schema.brand('mxfx/api/path'))

export const apiPath = (options?: { encode?: boolean }) => {
  const encode = options?.encode ?? true

  return (strings: TemplateStringsArray, ...values: readonly (string | number)[]): typeof pathBrandSchema.Type => {
    const path = strings.reduce((result, str, i) => {
      const value = values[i]
      const encodedValue = value ? (encode ? encodeURIComponent(value) : value) : ''
      return result + (str ?? '') + encodedValue
    }, '')

    return Schema.decodeSync(pathBrandSchema)(path)
  }
}

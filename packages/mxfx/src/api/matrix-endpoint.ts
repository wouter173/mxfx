import { HttpBody, HttpClientRequest, HttpClientResponse, UrlParams } from 'effect/unstable/http'
import { Effect, Schema } from 'effect'

export type MatrixEndpoint<T> = {
  path: typeof pathBrandSchema.Type
  auth: boolean
  params?: UrlParams.Input
  schema: Schema.Schema<T>
} & (
  | { method: 'GET'; body?: undefined }
  | {
      method: 'POST' | 'PUT' | 'DELETE' | 'PATCH'
      body?: HttpBody.HttpBody
    }
)

export const makeEndpoint = <T>(endpoint: MatrixEndpoint<T>) => Effect.succeed(endpoint)

export const makeHttpRequest = <T>(endpoint: MatrixEndpoint<T>) =>
  Effect.gen(function* () {
    return HttpClientRequest.make(endpoint.method)(endpoint.path, {
      body: endpoint.body ? endpoint.body : HttpBody.empty,
      urlParams: endpoint.params ? endpoint.params : UrlParams.empty,
    })
  })

export const parseHttpResponse = <T>(endpoint: MatrixEndpoint<T>) => HttpClientResponse.schemaBodyJson(endpoint.schema || Schema.Unknown)

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

import { HttpBody, HttpClientRequest, HttpClientResponse, UrlParams } from 'effect/unstable/http'
import { Effect, Schema } from 'effect'
import { encodeSnakeCaseSchema } from '../schema/encode-case'

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

export const makeEndpoint = <S extends Schema.Top>(endpoint: MatrixEndpoint<S>) => Effect.succeed(endpoint)

export const makeHttpRequest = <S extends Schema.Top>(endpoint: MatrixEndpoint<S>) =>
  Effect.gen(function* () {
    return HttpClientRequest.make(endpoint.method)(endpoint.path, {
      body: endpoint.body ? endpoint.body : HttpBody.empty,
      urlParams: endpoint.params ? endpoint.params : UrlParams.empty,
    })
  })

export const parseHttpResponse = <S extends Schema.Top>(endpoint: MatrixEndpoint<S>) =>
  HttpClientResponse.schemaBodyJson(endpoint.schema.pipe(encodeSnakeCaseSchema), { onExcessProperty: 'preserve' })

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

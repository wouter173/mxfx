import { Schema } from 'effect'
import { describe, expect, expectTypeOf, test } from 'vitest'

import {
  available,
  availableSince,
  availableWith,
  matrixVersion,
  type MatrixCapabilities,
  type Msc,
  versionedStruct,
} from './versioning.ts'

const v1_1 = matrixVersion(1, 1)
const v1_2 = matrixVersion(1, 2)

const fields = {
  roomId: Schema.String,
  stable: availableSince(v1_1)(Schema.Number),
  experimental: availableWith('MSC9999')(Schema.Boolean),
  promoted: available({ since: v1_2, unstable: ['MSC1234'] })(Schema.String),
}

describe('Matrix API schema versioning', () => {
  test('selects fields introduced by the configured stable version', () => {
    const schema = versionedStruct({ version: v1_1 })(fields)

    expect(Reflect.ownKeys(schema.fields)).toEqual(['roomId', 'stable'])
    expect(Schema.decodeUnknownSync(schema)({ roomId: '!room:example.org', stable: 1 })).toEqual({
      roomId: '!room:example.org',
      stable: 1,
    })

    expectTypeOf<typeof schema.Type>().toEqualTypeOf<Readonly<{ roomId: string; stable: number }>>()
  })

  test('selects fields enabled by an MSC', () => {
    const schema = versionedStruct({ version: matrixVersion(1, 0), mscs: ['MSC9999', 'MSC1234'] })(fields)

    expect(Reflect.ownKeys(schema.fields)).toEqual(['roomId', 'experimental', 'promoted'])
    expectTypeOf<typeof schema.Type>().toEqualTypeOf<Readonly<{ roomId: string; experimental: boolean; promoted: string }>>()
  })

  test('includes a promoted field through either its stable version or MSC', () => {
    const stableSchema = versionedStruct({ version: v1_2 })(fields)
    const unstableSchema = versionedStruct({ version: matrixVersion(1, 0), mscs: ['MSC1234'] })(fields)

    expect(Reflect.ownKeys(stableSchema.fields)).toContain('promoted')
    expect(Reflect.ownKeys(unstableSchema.fields)).toContain('promoted')
  })

  test('uses patch versions when selecting fields', () => {
    const patchFields = {
      always: Schema.String,
      later: availableSince(matrixVersion(1, 2, 3))(Schema.String),
    }

    expect(Reflect.ownKeys(versionedStruct({ version: matrixVersion(1, 2, 2) })(patchFields).fields)).toEqual(['always'])
    expect(Reflect.ownKeys(versionedStruct({ version: matrixVersion(1, 2, 3) })(patchFields).fields)).toEqual(['always', 'later'])
  })

  test('models fields selected from widened capabilities as optional', () => {
    const capabilities: MatrixCapabilities = { version: v1_2 }
    const schema = versionedStruct(capabilities)(fields)

    expect(Reflect.ownKeys(schema.fields)).toEqual(['roomId', 'stable', 'promoted'])
    expect(Schema.decodeUnknownSync(schema)({ roomId: '!room:example.org', stable: 1, promoted: 'stable' })).toEqual({
      roomId: '!room:example.org',
      stable: 1,
      promoted: 'stable',
    })
    expectTypeOf<typeof schema.Type>().toEqualTypeOf<
      Readonly<{
        roomId: string
        stable?: number
        experimental?: boolean
        promoted?: string
      }>
    >()
  })

  test('models fields selected from a widened MSC array as optional', () => {
    const mscs: ReadonlyArray<Msc> = ['MSC9999']
    const schema = versionedStruct({ version: matrixVersion(1, 0), mscs })(fields)

    expect(Reflect.ownKeys(schema.fields)).toEqual(['roomId', 'experimental'])
    expectTypeOf<typeof schema.Type>().toEqualTypeOf<
      Readonly<{
        roomId: string
        experimental?: boolean
        promoted?: string
      }>
    >()
  })

  test('rejects invalid version components', () => {
    expect(() => matrixVersion(1, -1)).toThrow(RangeError)
    expect(() => matrixVersion(1, 1.5)).toThrow(RangeError)
  })
})

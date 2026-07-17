import { Schema } from 'effect'

/** A Matrix specification version, represented as `[major, minor, patch]`. */
export type MatrixVersion = readonly [major: number, minor: number, patch: number]

/** The identifier of a Matrix Spec Change. */
export type Msc = `MSC${number}`

/**
 * Capabilities supported by a homeserver.
 *
 * Keep this value literal (`as const`) to have unavailable fields removed from
 * both the schema and its inferred TypeScript type.
 */
export interface MatrixCapabilities<Version extends MatrixVersion = MatrixVersion, Mscs extends ReadonlyArray<Msc> = ReadonlyArray<Msc>> {
  readonly version: Version
  readonly mscs?: Mscs
}

export type FieldAvailability =
  | {
      readonly since: MatrixVersion
      readonly unstable?: ReadonlyArray<Msc>
    }
  | {
      readonly since?: never
      readonly unstable: readonly [Msc, ...Array<Msc>]
    }

declare module 'effect/Schema' {
  namespace Annotations {
    interface Annotations {
      /** Matrix versions or unstable features in which a schema field exists. */
      readonly mxfxAvailability?: FieldAvailability | undefined
    }
  }
}

declare const versionedFieldTypeId: unique symbol

/** A field schema carrying Matrix availability metadata. */
export type VersionedField<S extends Schema.Top, Availability extends FieldAvailability> = S & {
  readonly [versionedFieldTypeId]: Availability
}

/** Construct a validated Matrix specification version. */
export const matrixVersion = <const Major extends number, const Minor extends number, const Patch extends number = 0>(
  major: Major,
  minor: Minor,
  patch: Patch = 0 as Patch,
): readonly [Major, Minor, Patch] => {
  if (![major, minor, patch].every(part => Number.isSafeInteger(part) && part >= 0)) {
    throw new RangeError('Matrix version components must be non-negative integers')
  }

  return [major, minor, patch]
}

/**
 * Mark a struct field as available in a stable version and/or behind one of
 * the listed MSCs. Stable and unstable alternatives use OR semantics.
 */
export const available =
  <const Availability extends FieldAvailability>(availability: Availability) =>
  <S extends Schema.Top>(schema: S): VersionedField<S, Availability> =>
    schema.annotate({ mxfxAvailability: availability }) as VersionedField<S, Availability>

/** Mark a struct field as introduced by a stable Matrix specification version. */
export const availableSince =
  <const Version extends MatrixVersion>(version: Version) =>
  <S extends Schema.Top>(schema: S): VersionedField<S, { readonly since: Version }> =>
    available({ since: version })(schema)

/** Mark a struct field as available when a Matrix Spec Change is enabled. */
export const availableWith =
  <const Feature extends Msc>(feature: Feature) =>
  <S extends Schema.Top>(schema: S): VersionedField<S, { readonly unstable: readonly [Feature] }> =>
    available({ unstable: [feature] })(schema)

type BuildTuple<N extends number, Acc extends ReadonlyArray<unknown> = readonly []> = number extends N
  ? ReadonlyArray<unknown>
  : Acc['length'] extends N
    ? Acc
    : BuildTuple<N, readonly [...Acc, unknown]>

type LessThanOrEqual<A extends number, B extends number> = number extends A | B
  ? boolean
  : BuildTuple<B> extends readonly [...BuildTuple<A>, ...ReadonlyArray<unknown>]
    ? true
    : false

type Equal<A extends number, B extends number> = A extends B ? (B extends A ? true : false) : false

type IsAtLeast<Current extends MatrixVersion, Required extends MatrixVersion> =
  Equal<Current[0], Required[0]> extends true
    ? Equal<Current[1], Required[1]> extends true
      ? LessThanOrEqual<Required[2], Current[2]>
      : LessThanOrEqual<Required[1], Current[1]>
    : LessThanOrEqual<Required[0], Current[0]>

type SupportsAny<Mscs extends ReadonlyArray<Msc>, Required extends ReadonlyArray<Msc>> =
  Extract<Mscs[number], Required[number]> extends never ? false : true

type IsAvailable<Capabilities extends MatrixCapabilities, Availability extends FieldAvailability> = Availability extends {
  readonly since: infer Version extends MatrixVersion
}
  ? IsAtLeast<Capabilities['version'], Version> extends true
    ? true
    : Availability extends { readonly unstable: infer Required extends ReadonlyArray<Msc> }
      ? SupportsAny<NonNullable<Capabilities['mscs']>, Required>
      : false
  : Availability extends { readonly unstable: infer Required extends ReadonlyArray<Msc> }
    ? SupportsAny<NonNullable<Capabilities['mscs']>, Required>
    : false

type SelectFields<Fields extends Schema.Struct.Fields, Capabilities extends MatrixCapabilities> = {
  readonly [Key in keyof Fields as Fields[Key] extends VersionedField<Schema.Top, infer Availability>
    ? IsAvailable<Capabilities, Availability> extends true
      ? Key
      : never
    : Key]: Fields[Key]
}

const isAvailable = (capabilities: MatrixCapabilities, availability: FieldAvailability): boolean => {
  const [major, minor, patch] = capabilities.version
  const stable = availability.since
    ? major > availability.since[0] ||
      (major === availability.since[0] &&
        (minor > availability.since[1] || (minor === availability.since[1] && patch >= availability.since[2])))
    : false
  const unstable = availability.unstable?.some(feature => capabilities.mscs?.includes(feature)) ?? false

  return stable || unstable
}

/**
 * Build a struct schema containing exactly the fields supported by the supplied
 * Matrix capabilities. Unannotated fields are always included.
 */
export const versionedStruct =
  <const Capabilities extends MatrixCapabilities>(capabilities: Capabilities) =>
  <const Fields extends Schema.Struct.Fields>(fields: Fields): Schema.Struct<SelectFields<Fields, Capabilities>> => {
    const selected = Object.fromEntries(
      Reflect.ownKeys(fields).flatMap(key => {
        const field = fields[key]
        const availability = field === undefined ? undefined : Schema.resolveAnnotations(field)?.mxfxAvailability

        return availability === undefined || isAvailable(capabilities, availability) ? [[key, field]] : []
      }),
    ) as SelectFields<Fields, Capabilities>

    return Schema.Struct(selected)
  }

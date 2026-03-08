import { Effect, Schema } from 'effect'

const nameSchema = Schema.String.pipe(Schema.brand('playground/name'))

export class Category extends Schema.Opaque<Category>()(
  Schema.Struct({
    name: nameSchema,
    groups: Schema.Array(Schema.suspend((): Schema.Codec<Group, GroupEncoded> => Group)),
  }),
) {}

interface CategoryEncoded extends Schema.Codec.Encoded<typeof Category> {}

export class Group extends Schema.Opaque<Group>()(
  Schema.Struct({
    name: nameSchema,
    categories: Schema.Array(Schema.suspend((): Schema.Codec<Category, CategoryEncoded> => Category)),
  }),
) {}

interface GroupEncoded extends Schema.Codec.Encoded<typeof Group> {}

/*
type Encoded = {
    readonly children: readonly Category[];
    readonly name: string;
}
*/
export type Encoded = (typeof Category)['Encoded']

const program = Effect.gen(function* () {
  yield* Schema.decodeEffect(Category)({
    name: 'Root',
    groups: [{ name: 'Child 1', categories: [{ name: 'Category 1', groups: [] }] }],
  })
})

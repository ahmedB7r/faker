import * as types from './graphql/types/'
import { DateTimeResolver, JSONObjectResolver } from 'graphql-scalars'
// import { GraphQLScalarType } from 'graphql'
import { nexusPrisma } from 'nexus-plugin-prisma'
import { makeSchema, declarativeWrappingPlugin, asNexusMethod } from 'nexus'
import * as path from 'path'
import { Query } from './graphql/resolvers/query'
import { Mutation } from './graphql/resolvers/mutation/auth'
const jsonScalar = asNexusMethod(JSONObjectResolver, 'json')
const dateTimeScalar = asNexusMethod(DateTimeResolver, 'date')
export const schema = makeSchema({
  types: [dateTimeScalar, jsonScalar, Object.values(types), Query, Mutation],
  plugins: [
    declarativeWrappingPlugin(),
    nexusPrisma({
      experimentalCRUD: true,
      paginationStrategy: 'prisma',
      scalars: {
        DateTime: DateTimeResolver,
        // Json: new GraphQLScalarType({
        //   ...JSONObjectResolver,
        //   name: 'Json',
        //   description:
        //     'The `JSON` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).',
        // }),
      },
    }),
  ],
  outputs: {
    typegen: path.join(
      __dirname,
      '../../node_modules/@types/nexus-typegen/index.d.ts',
    ),
    schema: path.join(__dirname, './api.graphql'),
  },

  contextType: {
    module: require.resolve('./utils/context'),
    export: 'Context',
  },
  sourceTypes: {
    modules: [
      {
        module: require.resolve('.prisma/client/index.d.ts'),
        alias: 'prisma',
      },
    ],
  },
})

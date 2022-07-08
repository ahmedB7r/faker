import {
  arg,
  enumType,
  extendType,
  inputObjectType,
  intArg,
  list,
  nonNull,
  objectType,
  stringArg,
} from 'nexus'
// import hashPassword from '../../utils/hashPassword'
// import * as bcrypt from 'bcryptjs'

export const User = objectType({
  name: 'User',
  definition(t) {
    t.model.id()
    t.model.email()
    t.model.name()
    t.model.phone()
    t.model.password()
    t.model.avatar()
    t.model.role()
  },
})

export const UserQuery = extendType({
  type: 'Query',
  definition(t) {
    // t.crud.user()
    // t.field('user', {
    //   type: 'User',
    //   args: {
    //     where: arg({ type: 'UserWhereUniqeInput' }),
    //   },
    //   async resolve(source, args, ctx) {
    //     return await ctx.db.user.findUnique(args)
    //   },
    // })
    // t.crud.users({ filtering: true, ordering: true, pagination: true })
    // t.field('users', {
    //   type: objectType({
    //     name: 'userConnectionPayLoad',
    //     definition(t) {
    //       t.int('count')
    //       t.list.field('nodes', { type: 'User' })
    //     },
    //   }),
    //   args: {
    //     skip: intArg(),
    //     take: intArg(),
    //     orderBy: 'UserOrderByWithRelationInput',
    //     where: 'UserWhereInput',
    //   },
    //   async resolve(source, args, ctx) {
    //     return {
    //       //@ts-ignore
    //       count: await ctx.db.user.count({ where: args.where }),
    //       //@ts-ignore
    //       nodes: await ctx.db.user.findMany(args),
    //     }
    //   },
    // })
  },
})

export const Usermutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('updateMyProfile', {
      type: 'User',
      args: {
        name: stringArg(),
        email: stringArg(),
        phone: stringArg(),
        avatar: stringArg(),
        notificationToken: stringArg(),
      },
      async resolve(source, args, ctx) {
        if (!ctx?.user?.id) throw new Error('must login first please')

        return await ctx.db.user.update({
          where: { id: ctx.user.id },
          data: {
            ...args,
          },
        })
      },
    })
  },
})

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

export const Request = objectType({
  name: 'Request',
  definition(t) {
    t.model.id()
    t.model.user()
  },
})

export const RequestsQuery = extendType({
  type: 'Query',
  definition(t) {
    t.crud.requests({ ordering: true, filtering: true })
    t.field('requests', {
      type: objectType({
        name: 'RequestConnectionPayLoad',
        definition(t) {
          t.int('count')
          t.list.field('nodes', { type: 'Request' })
        },
      }),
      args: {
        skip: intArg(),
        take: intArg(),
        orderBy: 'RequestOrderByWithRelationInput',
        where: 'RequestWhereInput',
      },
      async resolve(source, args, ctx) {
        //@ts-ignore
        args.where = { AND: [{ patientId: ctx.user?.id }, { ...args.where }] }
        return {
          count: await ctx.db.request.count({
            //@ts-ignore
            where: args.where,
          }),
          //@ts-ignore
          nodes: await ctx.db.request.findMany(args),
        }
      },
    })
  },
})

export const RequestsMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('sendRequestToBeCareGiver', {
      type: 'Request',
      args: {
        email: nonNull(stringArg()),
      },
      async resolve(_root, args, ctx) {
        const { email } = args
        const isEmailExist = await ctx.db.user.findFirst({
          where: {
            role: 'PATIENT',
            email: { equals: email, mode: 'insensitive' },
          },
        })

        if (!isEmailExist) {
          throw new Error('sorry but there is no patient with this email ')
        }
        const Request = await ctx.db.request.create({
          data: {
            user: { connect: { id: ctx.user.id } },
            patient: { connect: { email } },
          },
        })

        return Request
      },
    })
    t.field('acceptRequest', {
      type: 'Request',
      args: {
        id: nonNull(intArg()),
      },
      async resolve(_root, args, ctx) {
        const { id } = args
        const Request = await ctx.db.request.findUnique({
          where: { id },
          select: {
            user: {
              select: {
                id: true,
                role: true,
              },
            },
          },
        })
        await ctx.db.user.update({
          where: { id: ctx.user.id },
          data: {
            carGivers:
              Request?.user.role == 'CARE_GIVER'
                ? { connect: { id: Request?.user.id } }
                : undefined,
            relatives:
              Request?.user.role == 'RELATIVE'
                ? { connect: { id: Request?.user.id } }
                : undefined,
          },
        })
        return await ctx.db.request.update({
          where: { id },
          data: { status: 'ACCEPTED' },
        })
      },
    })
    t.field('refuseRequest', {
      type: 'Request',
      args: {
        id: nonNull(intArg()),
      },
      async resolve(_root, args, ctx) {
        const { id } = args
        return await ctx.db.request.update({
          where: { id },
          data: { status: 'REFUSED' },
        })
      },
    })
  },
})

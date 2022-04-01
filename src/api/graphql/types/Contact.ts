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

export const Contact = objectType({
  name: 'Contact',
  definition(t) {
    t.model.id()
    t.model.description()
    t.model.images()
    t.model.mainImage()
    t.model.phone()

    t.model.message()
    t.model.name()
    t.model.patient()
    t.model.type()
  },
})

export const ConatctQuery = extendType({
  type: 'Query',
  definition(t) {
    t.crud.contact()

    t.crud.contacts({ filtering: true, ordering: true, pagination: true })
    t.field('contacts', {
      type: objectType({
        name: 'ContactConnectionPayLoad',
        definition(t) {
          t.int('count')
          t.list.field('nodes', { type: 'Contact' })
        },
      }),
      args: {
        skip: intArg(),
        take: intArg(),
        orderBy: 'ContactOrderByWithRelationInput',
        where: 'ContactWhereInput',
      },
      async resolve(source, args, ctx) {
        //@ts-ignore
        args.where =
          ctx.user.role == 'PATIENT'
            ? {
                AND: [
                  {
                    OR: [
                      { userId: ctx.user?.id },
                      {
                        patient: {
                          caregiverPatientId: { equals: ctx.user.id },
                        },
                      },
                    ],
                  },
                  { ...args.where },
                ],
              }
            : { AND: [{ userId: ctx.user?.id }, { ...args.where }] }
        return {
          count: await ctx.db.contact.count({
            //@ts-ignore
            where: args.where,
          }),
          //@ts-ignore
          nodes: await ctx.db.contact.findMany(args),
        }
      },
    })
  },
})

export const Contactmutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('addContact', {
      type: 'Contact',
      args: {
        mainImage: stringArg(),
        phone: stringArg(),

        description: stringArg(),
        images: nonNull(list(nonNull(stringArg()))),
        message: stringArg(),
        name: stringArg(),
        type: nonNull(arg({ type: 'ContactType' })),
      },
      async resolve(_root, args, ctx) {
        const {
          name,
          mainImage,
          phone,
          description,
          images,
          message,
          type,
          ...rest
        } = args

        const contact = await ctx.db.contact.create({
          data: {
            name,
            mainImage,
            description,
            images,
            message,
            type,
            phone,
            patient: { connect: { id: ctx.user.id } },
          },
        })

        return contact
      },
    })
    t.field('updateContact', {
      type: 'Contact',
      args: {
        id: nonNull(intArg()),
        mainImage: stringArg(),
        phone: stringArg(),

        description: stringArg(),
        images: nonNull(list(nonNull(stringArg()))),
        message: stringArg(),
        name: stringArg(),
        type: nonNull(arg({ type: 'ContactType' })),
      },
      async resolve(_root, args, ctx) {
        const {
          name,
          phone,
          mainImage,
          description,
          images,
          message,
          type,
          id,
        } = args

        const contact = await ctx.db.contact.update({
          where: { id },
          data: {
            name,
            mainImage,
            description,
            images,
            phone,
            message,
            type,
          },
        })

        return contact
      },
    })
    t.crud.deleteOneContact()
  },
})

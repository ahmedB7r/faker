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

export const Event = objectType({
  name: 'Event',
  definition(t) {
    t.model.id()
    t.model.description()
    t.model.name()
    t.model.patient()
    t.model.type()
    t.model.days()
    t.model.eventDate()
    t.model.isDone()
    t.model.times()
  },
})

export const EventQuery = extendType({
  type: 'Query',
  definition(t) {
    t.crud.event()

    t.crud.events({ filtering: true, ordering: true, pagination: true })
    t.field('events', {
      type: objectType({
        name: 'EventConnectionPayLoad',
        definition(t) {
          t.int('count')
          t.list.field('nodes', { type: 'Event' })
        },
      }),
      args: {
        skip: intArg(),
        take: intArg(),
        orderBy: 'EventOrderByWithRelationInput',
        where: 'EventWhereInput',
      },
      async resolve(source, args, ctx) {
        //@ts-ignore
        args.where = {
          AND: [
            {
              OR: [
                { patientId: { equals: ctx.user?.id } },
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

        return {
          count: await ctx.db.event.count({
            //@ts-ignore
            where: args.where,
          }),
          //@ts-ignore
          nodes: await ctx.db.event.findMany(args),
        }
      },
    })
  },
})

export const Eventmutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('addEvent', {
      type: 'Event',
      args: {
        days: list(nonNull(arg({ type: 'DAY' }))),
        type: nonNull(arg({ type: 'EventType' })),
        name: stringArg(),
        description: stringArg(),
        eventDate: arg({ type: 'DateTime' }),
        times: list(nonNull(arg({ type: 'DateTime' }))),
      },
      async resolve(_root, args, ctx) {
        const { days, type, name, description, eventDate, times } = args

        const Event = await ctx.db.event.create({
          data: {
            days: days ? { set: days } : undefined,
            type,
            name,
            description,
            isDone: type == 'UPDATE' ? true : false,
            eventDate,
            times: times ? { set: times } : undefined,
            patient: { connect: { id: ctx.user.id } },
          },
        })

        return Event
      },
    })
    t.field('updateEvent', {
      type: 'Event',
      args: {
        id: nonNull(intArg()),
        days: list(nonNull(arg({ type: 'DAY' }))),
        type: nonNull(arg({ type: 'EventType' })),
        name: stringArg(),
        description: stringArg(),
        eventDate: arg({ type: 'DateTime' }),
        times: list(nonNull(arg({ type: 'DateTime' }))),
      },
      async resolve(_root, args, ctx) {
        const { id, days, type, name, description, eventDate, times } = args

        const Event = await ctx.db.event.update({
          where: { id },
          data: {
            days: days ? { set: days } : undefined,
            type,
            isDone: type == 'UPDATE' ? true : false,
            name,
            description,
            eventDate,
            times: times ? { set: times } : undefined,
            patient: { connect: { id: ctx.user.id } },
          },
        })

        return Event
      },
    })
    t.crud.deleteOneEvent()
  },
})
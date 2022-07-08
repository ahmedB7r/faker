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
import { pushNotification } from '../../utils/notifications'
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
    t.model.images()
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
        images: list(nonNull(stringArg())),
      },
      async resolve(_root, args, ctx) {
        const { days, type, name, description, eventDate, times, images } = args

        const patient = await ctx.db.user.findUnique({
          where: { id: ctx.user.id },
          select: { caregiverPatientId: true },
        })
        console.log(
          '🚀 ~ file: Event.ts ~ line 104 ~ resolve ~ patient',
          patient,
        )

        const Event = await ctx.db.event.create({
          data: {
            days: days ? { set: days } : undefined,
            type,
            name,
            description,
            isDone: type == 'UPDATE' ? true : false,
            eventDate,
            images: images || undefined,
            times: times ? { set: times } : undefined,
            patient: {
              connect: { id: patient?.caregiverPatientId || ctx.user.id },
            },
          },
        })

        if (type == 'UPDATE') {
          const user = await ctx.db.user.findUnique({
            where: { id: ctx.user.id },
          })
          user?.notificationToken &&
            (await pushNotification({
              token: user?.notificationToken,
              message: description,
              title: name,
              data: { ...Event, notificationType: 'event' },
            }))
        }

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
        images: list(nonNull(stringArg())),
      },
      async resolve(_root, args, ctx) {
        const { id, days, type, name, description, eventDate, times, images } =
          args

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
            // patient: { connect: { id: ctx.user.id } },
            images: images || undefined,
          },
        })

        return Event
      },
    })
    t.crud.deleteOneEvent()
  },
})

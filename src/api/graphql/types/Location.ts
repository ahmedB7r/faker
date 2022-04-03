import {
  arg,
  enumType,
  extendType,
  floatArg,
  inputObjectType,
  intArg,
  list,
  nonNull,
  objectType,
  stringArg,
} from 'nexus'
// import hashPassword from '../../utils/hashPassword'
// import * as bcrypt from 'bcryptjs'

export const Location = objectType({
  name: 'Location',
  definition(t) {
    t.model.id()
    t.model.centerLatitude()
    t.model.centerLongitude()
    t.model.distance()
    t.model.latitude()
    t.model.longitude()
    t.model.user()
  },
})

export const LocationQuery = extendType({
  type: 'Query',
  definition(t) {
    t.crud.location()
    t.field('patientLocation', {
      type: 'Location',
      async resolve(source, args, ctx) {
        const patient = await ctx.db.user.findFirst({
          where: { carGivers: { some: { id: ctx.user.id } } },
          select: { id: true },
        })
        return await ctx.db.location.findUnique({
          where: { userId: patient?.id },
        })
      },
    })
  },
})

export const Locationmutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('updateLocation', {
      type: 'Location',
      args: {
        centerLatitude: stringArg(),
        centerLongitude: stringArg(),
        distance: floatArg(),
      },
      async resolve(_root, args, ctx) {
        const { centerLatitude, centerLongitude, distance } = args
        const patient = await ctx.db.user.findFirst({
          where: { carGivers: { some: { id: ctx.user.id } } },
          select: { id: true },
        })

        const Location = await ctx.db.location.upsert({
          where: { userId: ctx.user.id },
          create: {
            centerLatitude,
            centerLongitude,
            distance,
            user: { connect: { id: patient?.id } },
          },
          update: { centerLatitude, centerLongitude, distance },
        })
        return Location
      },
    })
    t.field('updatePatientLocation', {
      type: 'Location',
      args: {
        latitude: stringArg(),
        longitude: stringArg(),
      },
      async resolve(_root, args, ctx) {
        const { latitude, longitude } = args

        const Location = await ctx.db.location.upsert({
          where: { userId: ctx.user.id },
          create: {
            latitude,
            longitude,
            user: { connect: { id: ctx.user.id } },
          },
          update: { latitude, longitude },
        })

        return Location
      },
    })
    t.crud.deleteOneLocation()
  },
})

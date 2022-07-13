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
import { pushNotification } from '../../utils/notifications'
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
      //@ts-ignore
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
          select: {
            user: {
              select: {
                name: true,
                carGivers: {
                  select: {
                    notificationToken: true,
                    location: {
                      select: {
                        latitude: true,
                        longitude: true,
                        distance: true,
                      },
                    },
                  },
                },
              },
            },
          },
        })
        await Promise.allSettled(
          Location.user.carGivers.map(
            async ({ location, notificationToken }) => {
              const distanceNow = distance(
                latitude,
                longitude,
                location?.latitude,
                location?.longitude,
                'K',
              )

              if (distanceNow > (location?.distance || 0)) {
                notificationToken &&
                  (await pushNotification({
                    token: notificationToken,
                    message: Location.user + ' is so far ' + distanceNow + 'km',
                    title: Location.user + ' is so far ' + distanceNow + 'km',
                    data: { notificationType: 'location' },
                  }))
              }
            },
          ),
        )

        return Location
      },
    })
    t.crud.deleteOneLocation()
  },
})
function distance(lat1, lon1, lat2, lon2, unit) {
  if (lat1 == lat2 && lon1 == lon2) {
    return 0
  } else {
    var radlat1 = (Math.PI * lat1) / 180
    var radlat2 = (Math.PI * lat2) / 180
    var theta = lon1 - lon2
    var radtheta = (Math.PI * theta) / 180
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
    if (dist > 1) {
      dist = 1
    }
    dist = Math.acos(dist)
    dist = (dist * 180) / Math.PI
    dist = dist * 60 * 1.1515
    if (unit == 'K') {
      dist = dist * 1.609344
    }
    if (unit == 'N') {
      dist = dist * 0.8684
    }
    return dist
  }
}

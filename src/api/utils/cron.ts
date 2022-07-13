import { prisma } from './createContext'

import moment from 'moment'
import { pushNotification } from './notifications'

const days = {
  Saturday: 'SAT',
  Sunday: 'SUN',
  Monday: 'MON',
  Tuesday: 'TUE',
  Wednesday: 'WED',
  Thursday: 'THU',
  Friday: 'FRI',
}
var CronJobManager = require('cron-job-manager')
export const cronManager = new CronJobManager()

const options = {
  start: true,
  timeZone: 'UTC',
}

const fireEvents = async () => {
  try {
    const events = await prisma.event.findMany({
      where: { isDone: false, eventDate: { lte: moment().toDate() } },
      select: {
        id: true,
        patient: {
          select: { notificationToken: true },
        },
        description: true,
        name: true,
      },
    })
    await Promise.all(
      events.map(async (event) => {
        await prisma.event.update({
          where: { id: event.id },
          data: { isDone: true },
        })
        console.log(
          '🚀 ~ file: cron.ts ~ line 51 ~ events.map ~ event',
          event.patient,
        )

        event?.patient?.notificationToken &&
          (await pushNotification({
            token: event?.patient?.notificationToken,
            message: event.description,
            title: event.name,
            data: { ...event, notificationType: 'event' },
          }))
      }),
    )
    var day = moment().format('dddd')
    console.log('🚀 ~ file: cron.ts ~ line 43 ~ fireEvents ~ day', day)
    const medicines = await prisma.event.findMany({
      where: {
        isDone: false,
        lastFire: { lt: moment().startOf('day').toDate() },
        days: { has: days[day] },
      },
      select: {
        id: true,
        times: true,
        name: true,
        description: true,
        patientId: true,
      },
    })
    await Promise.all(
      medicines.map(async ({ id, times, name, description, patientId }) => {
        await prisma.event.update({
          where: { id },
          data: { lastFire: moment().startOf('day').toDate() },
        })
        times.map((time) => {
          console.log(
            "🚀 ~ file: cron.ts ~ line 77 ~ times.map ~ moment(time).format('HH:mm:ss')",
            moment(time).format('HH:mm:ss'),
          )
          console.log(
            "🚀 ~ file: cron.ts ~ line 78 ~ times.map ~ moment(moment().add(2, 'hours').format('HH:mm:ss')",
            moment(moment().add(2, 'hours').format('HH:mm:ss')),
          )

          const milliseconds = moment(moment(time).format('HH:mm:ss')).diff(
            moment(moment().add(2, 'hours').format('HH:mm:ss')),
            'milliseconds',
          )
          console.log(
            '🚀 ~ file: cron.ts ~ line 79 ~ times.map ~ milliseconds',
            milliseconds,
          )

          setTimeout(async () => {
            const event = await prisma.event.create({
              data: {
                name,
                description,
                isDone: true,
                patient: { connect: { id: patientId } },
              },
              include: {
                patient: true,
              },
            })
            console.log(
              '🚀 ~ file: cron.ts ~ line 113 ~ setTimeout ~ event',
              event.patient,
            )

            event?.patient?.notificationToken &&
              (await pushNotification({
                token: event?.patient?.notificationToken,
                message: event.description,
                title: event.name,
                data: { ...event, notificationType: 'event' },
              }))
          }, milliseconds)
        })
      }),
    )
  } catch (error) {
    console.log('🚀 ~ file: cron.ts ~ line 150 ~ updateCurrency ~ error', error)
  }
}
export const startCron = async () => {
  cronManager.add('fireEvents', '* * * * *', fireEvents, options)
}

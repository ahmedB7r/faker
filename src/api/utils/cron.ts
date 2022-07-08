import { prisma } from './createContext'

import moment from 'moment'

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
      select: { id: true },
    })
    await Promise.all(
      events.map(async ({ id }) => {
        await prisma.event.update({
          where: { id },
          data: { isDone: true },
        })
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
          setTimeout(async () => {
            await prisma.event.create({
              data: {
                name,
                description,
                isDone: true,
                patient: { connect: { id: patientId } },
              },
            })
          }, moment(moment(time).format('HH:mm:ss')).diff(moment(moment().format('HH:mm:ss')), 'milliseconds'))
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

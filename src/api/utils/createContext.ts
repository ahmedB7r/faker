import { Auth } from './auth'
import { PrismaClient } from '@prisma/client'
import { Response } from 'express'
import { PubSub } from 'graphql-subscriptions'

export const prisma = new PrismaClient({
  // log: ['query', 'error', 'warn'],
  // errorFormat: 'pretty',
})
const pubsub = new PubSub()

export const createContext = async ({
  req,
  res,
  connection,
}: {
  req?: any
  res?: Response
  connection: any
}) => {
  if (connection) {
    const auth = new Auth({
      req: {
        ...connection?.context,
        cookies: {},
        headers: { ...connection?.context?.headers },
      },
      res: connection?.context,
    })
    const user = await auth.authenticate()

    return {
      auth,
      user,
      db: prisma,
      req,
      pubsub,
    }
  }

  const auth = new Auth({
    req,
    res,
  })
  const user = await auth.authenticate()

  const ctx = {
    auth,
    user,
    db: prisma,
    req,
    pubsub,
  }

  return ctx
}

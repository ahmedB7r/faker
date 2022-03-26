import { Auth } from './auth'
import { PrismaClient, User } from '@prisma/client'
import { Request } from 'express'
import { PubSub } from 'graphql-subscriptions'

export type Context = {
  auth: Auth
  user: User
  db: PrismaClient
  req: Request
  pubsub: PubSub
}

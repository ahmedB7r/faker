require('make-promises-safe')
import cookieParser from 'cookie-parser'
import doRestRouting from './REST'
import slowDown from 'express-slow-down'

import { ApolloServer } from 'apollo-server-express'
import createExpress, { json } from 'express'
import { schema as baseSchema } from './schema'
import { createContext, prisma } from './utils/createContext'
import { startCron } from './utils/cron'
// const path = require('path')
// import { ApolloServerPluginInlineTrace } from 'apollo-server-core'
// import DigitalOcean from 'do-wrapper'
import { permissions } from './shield'
const { applyMiddleware } = require('graphql-middleware')
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import compression from 'compression'
// import hashPassword from './utils/hashPassword'
const depthLimit = require('graphql-depth-limit')
const { createComplexityLimitRule } = require('graphql-validation-complexity')
// import { storeSeed } from '../seed/storeSeed'
// import axios from 'axios'
import { execute, subscribe } from 'graphql'
// import { makeExecutableSchema } from '@graphql-tools/schema'

// import * as tf from '@tensorflow/tfjs'
// import * as faker from 'faker'
// import { paymentsSeed, shopPaymentsSeed } from '../seed/main/paymentMethods'
import passport from 'passport'
import { SubscriptionServer } from 'subscriptions-transport-ws'
import { createServer } from 'http'
// import MP from '@knawat/mp'
const RedisStore = require('rate-limit-redis')
import { URL } from 'url'
import sendMailSgMail from './utils/sgmail'
import axios from 'axios'
// import { redisClient } from './shield/redis'
import * as fs from 'fs'
import * as path from 'path'
import * as csv from 'fast-csv'
import makeSlug from 'slug-arabic' // by B7r :)
import { uploadToCloudinary } from './utils/uploadtoCloudinary'
import hashPassword from './utils/hashPassword'
const session = require('express-session')
const Redis = require('ioredis')
let redisClient
try {
  redisClient = new Redis(process.env.REDIS_URL)
} catch (error) {
  console.log('🚀 ~ file: app.ts ~ line 45 ~ error', error)
}
console.log(
  '🚀 ~ file: app.ts ~ line 89 ~ express.get ~ process.env.REDIS_UR',
  process.env.REDIS_URL,
)
// redisClient.flushdb()

// const instance = new DigitalOcean(
//   '86852c06f2f552818d3b879302df6a279fa3ef13ee2087dd66c239164101bd95',
// )
const schema = applyMiddleware(baseSchema, permissions)
const express = createExpress()
const speedLimiter = slowDown({
  windowMs: 2 * 60 * 1000, // 2 minutes
  delayAfter: 200, // allow 600 requests per 15 minutes, then...
  delayMs: 500, // begin adding 500ms of delay per request above 100:
  store: new RedisStore({
    client: redisClient,
    // redisURL: process.env.REDIS_URL,
  }),

  // request # 101 is delayed   by  500ms
  // request # 102 is delayed by 1000ms
  // request # 103 is delayed by 1500ms
  // etc.
})

const speedLimiterForStore = slowDown({
  windowMs: 2 * 60 * 1000, // 2 minutes
  delayAfter: 20000, // allow 600 requests per 15 minutes, then...
  delayMs: 500, // begin adding 500ms of delay per request above 100:
  store: new RedisStore({
    client: redisClient,
    // redisURL: process.env.REDIS_URL,
  }),
  keyGenerator: (req /*, response*/) => {
    const parser = new URL(
      req?.get('origin') || `https://demo.${process.env.DOMAIN}`,
    )
    const host =
      req?.get('shop') ||
      (process.env.NODE_ENV == 'development' || parser.hostname == 'localhost'
        ? `demo.${process.env.DOMAIN}`
        : parser.hostname)

    return host
  },

  // request # 101 is delayed by  500ms
  // request # 102 is delayed by 1000ms
  // request # 103 is delayed by 1500ms
  // etc.
})

var sess = {
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 365 * 1000,
  },
}
console.log(
  "🚀 ~ file: app.ts ~ line 117 ~ express.get('env')",
  express.get('env'),
)

if (express.get('env') === 'production') {
  express.enable('trust proxy') // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)
  express.set('trust proxy', 2)
  sess.cookie.secure = true // serve secure cookies
}
if (express.get('env') === 'staging') {
  express.enable('trust proxy') // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)
  express.set('trust proxy', 1)
  sess.cookie.secure = true // serve secure cookies
}
// var geoip = require('geoip-lite')

// var ip = '154.239.245.209'
// var geo = geoip.lookup(ip)

// console.log(geo)
express.use(cookieParser())
express.use(session(sess))
express.get('/ip', async (request, response) => {
  try {
    // console.log('🚀 ~ file: app.ts ~ line 93 ~ express.get ~ request', request)
    const keys = await redisClient.keys('*')
    console.log('🚀 ~ file: app.ts ~ line 126 ~ apolloServer ~ keys', keys)
    const values = await redisClient.mget(keys)
    console.log('🚀 ~ file: app.ts ~ line 128 ~ apolloServer ~ values', values)
    response.send({
      ip: request.ip,
      data: keys.reduce((prev, key, i) => {
        return { ...prev, [key]: values[i] }
      }, {}),
      values,
      keys,
    })
  } catch (error) {
    console.log('🚀 ~ file: app.ts ~ line 110 ~ express.get ~ error', error)
    response.send({
      ip: request.ip,
      error,
    })
  }
})
//  apply to all requests
// ;(async () => {
//   const clientList = await redisClient.client('list')
//   console.log('🚀 ~ file: app.ts ~ line 108 ~ ; ~ clientList', clientList)

//   if (typeof clientList === 'string') {
//     await Promise.all(
//       clientList
//         .split('\n')
//         .filter((item) => item !== '')
//         .filter(
//           (item) => parseInt(item.match(/.*?idle=(.*)? flags=/)[1], 10) > 30,
//         ) // idle > 30 seconds
//         .map(async (item) => {
//           const id = item.match(/.*?id=(.*)? addr=/)[1]
//           const res = await redisClient.client('kill', 'id', id)
//           console.log('res', res)
//         }),
//     )
//   }
// })()

express.use(speedLimiter)
express.use(speedLimiterForStore)

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  store: new RedisStore({
    client: redisClient,
    // redisURL: process.env.REDIS_URL,
  }),
  message:
    'Too many requests from this IP, please try again soon, or talk to b7r team',
})
express.use(limiter)
express.use(compression())
express.use(
  helmet({
    contentSecurityPolicy: false,
  }),
)

express.use(passport.initialize())
express.use(passport.session())
// express.use(createExpress.session({ secret: 'SECRET' })); // session secret

doRestRouting(express)

const httpServer = createServer(express)

const apolloServer = async () => {
  const apollo = new ApolloServer({
    schema,
    context: createContext,
    // playground: process.env.NODE_ENV == 'production' ? undefined : true,
    introspection: process.env.NODE_ENV == 'production' ? undefined : true,
    // introspection: false,
    // playground: false,
    validationRules: [
      depthLimit(7),
      createComplexityLimitRule(1000000, {
        onCost: (cost) => console.log('query cost: ', cost),
      }),
    ],
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close()
            },
          }
        },
      },
    ],
    // plugins: [ApolloServerPluginInlineTrace()],
  })
  await apollo.start()
  // await redisClient.set('keys', 'a')
  // const keys = await redisClient.keys('*')
  // console.log('🚀 ~ file: app.ts ~ line 126 ~ apolloServer ~ keys', keys)
  // const values = await redisClient.mget(keys)
  // console.log('🚀 ~ file: app.ts ~ line 128 ~ apolloServer ~ values', values)
  apollo.applyMiddleware({
    app: express,
    cors: {
      origin: true,
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['POST'],
    },
  })
  const subscriptionServer = SubscriptionServer.create(
    {
      // This is the `schema` we just created.
      schema,
      // These are imported from `graphql`.
      execute,
      subscribe,
      async onConnect(connectionParams) {
        return await createContext({
          connection: { context: connectionParams },
        })
        // console.log(
        //   '🚀 ~ file: app.ts ~ line 81 ~ onConnect ~ connectionParams',
        //   connectionParams,
        // )
        // return connectionParams
      },
    },
    {
      // This is the `httpServer` we created in a previous step.
      server: httpServer,
      // This `server` is the instance returned from `new ApolloServer`.
      path: apollo.graphqlPath,
    },
  )
  // apollo.installSubscriptionHandlers(app)

  express.set('port', process.env.PORT || 4000)

  const app = httpServer.listen(express.get('port'), async () => {
    console.log(
      `🚀 Query endpoint ready at at ws://localhost:${express.get('port')}${
        apollo.graphqlPath
      }`,
    )

    console.log(
      `🚀 GraphQL service ready at http://localhost:${express.get(
        'port',
      )}/graphql`,
    )
  })
}

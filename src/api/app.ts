require('make-promises-safe')
//@ts-ignore
import cookieParser from 'cookie-parser'

import { ApolloServer } from 'apollo-server-express'
import createExpress, { json } from 'express'
import { schema as baseSchema } from './schema'
import { createContext, prisma } from './utils/createContext'

import { permissions } from './shield'
const { applyMiddleware } = require('graphql-middleware')

// import { execute, subscribe } from 'graphql'

import passport from 'passport'
// import { SubscriptionServer } from 'subscriptions-transport-ws'
import { createServer } from 'http'

const session = require('express-session')

const schema = applyMiddleware(baseSchema, permissions)
const express = createExpress()

var sess = {
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 365 * 1000,
  },
}

express.use(cookieParser())
express.use(session(sess))

express.use(passport.initialize())
express.use(passport.session())
// express.use(createExpress.session({ secret: 'SECRET' })); // session secret

const httpServer = createServer(express)

const apolloServer = async () => {
  const apollo = new ApolloServer({
    schema,
    context: createContext,
    introspection: process.env.NODE_ENV == 'production' ? undefined : true,
    // plugins: [
    //   {
    //     async serverWillStart() {
    //       return {
    //         async drainServer() {
    //           subscriptionServer.close()
    //         },
    //       }
    //     },
    //   },
    // ],
  })
  await apollo.start()

  apollo.applyMiddleware({
    app: express,
    cors: {
      origin: true,
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['POST'],
    },
  })
  //   const subscriptionServer = SubscriptionServer.create(
  //     {
  //       // This is the `schema` we just created.
  //       schema,
  //       // These are imported from `graphql`.
  //       execute,
  //       subscribe,
  //       async onConnect(connectionParams: any) {
  //         return await createContext({
  //           connection: { context: connectionParams },
  //         })
  //       },
  //     },
  //     {
  //       server: httpServer,
  //       path: apollo.graphqlPath,
  //     },
  //   )

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
  app.setTimeout(25 * 1000) // 10 * 60 seconds * 1000 msecs = 10 minutes
}
apolloServer()

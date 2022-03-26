import { rule } from 'graphql-shield'
import { Context } from '../utils/context'

export const isAuth = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    console.log('🚀 ~ file: rules.ts ~ line 28 ~ ctx.user', ctx.user)

    return Boolean(ctx.user)
  },
)
export const notBreakPagination = rule({ cache: 'strict' })(
  async (parent, args, ctx, info) => {
    if (!args.take) {
      throw new Error('you must specify take arg')
    }

    if (args.take > 100) {
      throw new Error("you can't get more than 100")
    }

    return true
  },
)

export const isHaveRole = (role: any) =>
  rule({ cache: 'contextual' })(async (parent, args, ctx: Context, info) => {
    if (role?.includes('all')) return true
    if (!ctx.user?.id) return false
    const user = await ctx.db.user.findFirst({
      where: {
        id: ctx.user?.id,
      },
      select: { role: true },
    })

    if (role?.includes(user?.role)) return true

    return false
    // const storePlan = await ctx.db.plan.count({
    //   where: { stores: { some: { domain: ctx.host } } },
    //   select: { slug: true },
    // })
    // console.log('🚀 ~ file: rules.ts ~ line 91 ~ rule ~ plan', plan)

    // if (storePlan.slug !== 'free' && plan !== storePlan.slug)
    //   throw new UserInputError(`please upgrade your plan to do this`)
  })

import { queryType } from 'nexus'

export const Query = queryType({
  definition(t) {
    t.field('me', {
      type: 'User',
      async resolve(_root, args, ctx) {
        const me = ctx.user
        if (!me) return null
        return ctx.db.user.findUnique({ where: { id: me.id } })
      },
    })
  },
})

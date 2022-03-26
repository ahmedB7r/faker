import { shield, and, or, not, allow, deny, race, chain } from 'graphql-shield'

import { isHaveRole } from './rules'

export const permissions = shield(
  {
    Mutation: {
      '*': allow,
    },
    Query: {
      '*': allow,
    },
  },
  { debug: true, allowExternalErrors: true },
)

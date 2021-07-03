import { client } from 'apollo/client'
import gql from 'graphql-tag'
import { Transaction, TransactionType } from 'types'
import { formatTokenSymbol } from 'utils/tokens'

const POOL_TRANSACTIONS = gql`
  query transactions($address: Bytes!) {
    stakes(orderBy: stakeTime, orderDirection: desc, where: { pool: $address }) {
      id
      pool {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      tokenId
      totalValueLocked
      staker
      stakeTime
    }
    unstakes(orderBy: unstakeTime, orderDirection: desc, where: { pool: $address }) {
      id
      pool {
        token0 {
          symbol
        }
        token1 {
          symbol
        }
      }
      tokenId
      totalValueLocked

      unstakeTime
    }
  }
`

interface TransactionResults {
  stakes: {
    id: string
    pool: {
      token0: {
        id: string
        symbol: string
      }
      token1: {
        id: string
        symbol: string
      }
    }
    tokenId: string
    totalValueLocked: string
    staker: string
    stakeTime: string
  }[]
  unstakes: {
    id: string

    pool: {
      token0: {
        id: string
        symbol: string
      }
      token1: {
        id: string
        symbol: string
      }
    }

    tokenId: string
    totalValueLocked: string
    // staker: string
    unstakeTime: string
  }[]
  // burns: {
  //   timestamp: string
  //   transaction: {
  //     id: string
  //   }
  //   pool: {
  //     token0: {
  //       id: string
  //       symbol: string
  //     }
  //     token1: {
  //       id: string
  //       symbol: string
  //     }
  //   }
  //   owner: string
  //   amount0: string
  //   amount1: string
  //   amountUSD: string
  // }[]
}

export async function fetchPoolTransactions(
  address: string
): Promise<{ data: Transaction[] | undefined; error: boolean; loading: boolean }> {
  const { data, error, loading } = await client.query<TransactionResults>({
    query: POOL_TRANSACTIONS,
    variables: {
      address: address,
    },
    fetchPolicy: 'cache-first',
  })
  console.log('TXN DATA========', data, error)

  if (error) {
    return {
      data: undefined,
      error: true,
      loading: false,
    }
  }

  if (loading && !data) {
    return {
      data: undefined,
      error: false,
      loading: true,
    }
  }
  // console.log('MINTS DATA=============', data)
  const mints = data?.stakes.map((m) => {
    return {
      type: TransactionType.MINT,
      hash: m.id,
      timestamp: m.stakeTime,

      pool: {
        token0: {
          id: m.pool.token0.id,
          symbol: m.pool.token0.symbol,
        },
        token1: {
          id: m.pool.token1.id,
          symbol: m.pool.token1.symbol,
        },
      },
      tokenId: m.tokenId,
      totalValueLocked: m.totalValueLocked,
      staker: m.staker,
      stakeTime: m.stakeTime,

      // sender: m.origin,
      // token0Symbol: formatTokenSymbol(m.pool.token0.id, m.pool.token0.symbol),
      // token1Symbol: formatTokenSymbol(m.pool.token1.id, m.pool.token1.symbol),
      // token0Address: m.pool.token0.id,
      // token1Address: m.pool.token1.id,
      // amountUSD: parseFloat(m.amountUSD),
      // amountToken0: parseFloat(m.amount0),
      // amountToken1: parseFloat(m.amount1),
    }
  })
  const burns = data?.unstakes.map((m) => {
    return {
      type: TransactionType.BURN,

      hash: m.id,
      timestamp: m.unstakeTime,

      pool: {
        token0: {
          id: m.pool.token0.id,
          symbol: m.pool.token0.symbol,
        },
        token1: {
          id: m.pool.token1.id,
          symbol: m.pool.token1.symbol,
        },
      },
      tokenId: m.tokenId,
      totalValueLocked: m.totalValueLocked,
      staker: '0xb520bb16aeb6f1b38508ba24da30d6fcf76da3cb',
      stakeTime: m.unstakeTime,
    }
  })

  // const swaps = data?.swaps.map((m) => {
  //   return {
  //     type: TransactionType.SWAP,
  //     hash: m.transaction.id,
  //     timestamp: m.timestamp,
  //     sender: m.origin,
  //     token0Symbol: formatTokenSymbol(m.pool.token0.id, m.pool.token0.symbol),
  //     token1Symbol: formatTokenSymbol(m.pool.token1.id, m.pool.token1.symbol),
  //     token0Address: m.pool.token0.id,
  //     token1Address: m.pool.token1.id,
  //     amountUSD: parseFloat(m.amountUSD),
  //     amountToken0: parseFloat(m.amount0),
  //     amountToken1: parseFloat(m.amount1),
  //   }
  // })
  console.log('MINTS DATA=============', mints, burns)

  return { data: [...mints, ...burns], error: false, loading: false }
}

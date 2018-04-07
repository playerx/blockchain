import * as transaction from '../transaction-pool'


export const typeDefs = `
	extend type Query {
		transactionPool: [Transaction!]!
	}

	type Transaction {
		id: ID!
		description: String
		txIns: [TxIn!]!
		txOuts: [TxOut!]!
	}

	type TxIn {
		txOutId: ID!
		txOutIndex: Int!
		signature: String!
	}

	type TxOut {
		address: String!
		amount: Float!
	}
`

export const resolvers = {
	Query: {
		transactionPool: () => transaction.getTransactionPool(),
	},

	Mutation: {
		// addTransaction: () => transaction.addToTransactionPool()
	},
}

import * as transactionPool from '../domain/transaction-pool'
import * as app from '../application'

export const typeDefs = `
	extend type Query {
		transactionPool: [Transaction!]!
		transaction(id: ID!): Transaction
		unspentTransactions: [UnspentTransaction!]!
	}

#	extend type Mutation {
#		sendCoins(data: sendCoinsInput!): Transaction!
#		mineTransactionBlock(description: String): Block
#	}

	type UnspentTransaction {
		address: String!
		amount: Float!
		txOutId: ID
		txOutIndex: Int
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
		transaction: Transaction
	}

	type TxOut {
		address: String!
		amount: Float!
	}

	input sendCoinsInput {
		toAddress: String!
		amount: Float!
		description: String
	}
`

export const resolvers = {
	Query: {
		transactionPool: () => transactionPool.getTransactionPool(),
		unspentTransactions: () => transactionPool.getUnspentTxOuts(),
		transaction: (_, { id }) => app.findTransaction(id),
	},

	Mutation: {
		// sendCoins: (_, { data }) => app.makeTransfer(data),
		// mineTransactionBlock: (_, { description }) => app.mineNextBlock(null, description)
	},

	TxIn: {
		transaction: ({ txOutIndex: blockIndex, txOutId: txId }) => app.findTransaction(txId, blockIndex)
	},
}

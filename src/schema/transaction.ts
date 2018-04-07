import * as transactionPool from '../domain/transaction-pool'


export const typeDefs = `
	extend type Query {
		transactionPool: [Transaction!]!
	}

	# extend type Mutation {
	# 	sendTransaction(info: SendTransactionInput!): Transaction!
	# }

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

	input SendTransactionInput {
		address: String!
		amount: Float!
		description: String
	}
`

export const resolvers = {
	Query: {
		transactionPool: () => transactionPool.getTransactionPool(),
	},

	Mutation: {
		// sendTransaction: (_, props) => sendTransaction(props)
	},
}

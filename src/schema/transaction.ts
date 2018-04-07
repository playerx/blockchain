import * as blockchain from '../core/blockchain'
import * as transaction from '../core/transaction'
import * as transactionPool from '../core/transaction-pool'
import * as wallet from '../core/wallet'

const sendTransaction = ({ address, amount, description }) => {

	const tx = wallet.createTransaction(address, amount, wallet.getPrivateKey(), blockchain.getUnspentTxOuts(), getTransactionPool());
	addToTransactionPool(tx, getUnspentTxOuts());
	broadCastTransactionPool();
	return tx;


	const tran = wallet.createTransaction(address, amount, )
	transactionPool.addToTransactionPool()

	return null
}


export const typeDefs = `
	extend type Query {
		transactionPool: [Transaction!]!
	}

	extend type Mutation {
		sendTransaction(info: SendTransactionInput!): Transaction!
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
		sendTransaction: (_, props) => sendTransaction(props)
	},
}

import * as app from '../application'

export const typeDefs = `
	extend type Query {
		balance(address: String!): Float!
		currentWallet: Wallet
	}

	type Wallet {
		publicKey: String!
		privateKey: String!
		balance: Float!
	}
`

export const resolvers = {
	Query: {
		balance: (_, { address }) => app.getBalance(address),
		currentWallet: () => app.getCurrentWallet(),
	},
}

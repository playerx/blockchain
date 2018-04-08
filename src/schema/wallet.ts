import * as app from '../application'

export const typeDefs = `
	extend type Query {
		balance(address: String!): Float!
		currentWallet: Wallet!
		allWallets: [Wallet!]!
	}

	type Wallet {
		address: String!
		balance: Float!
		privateKey: String
	}
`

export const resolvers = {
	Query: {
		balance: (_, { address }) => app.getBalance(address),
		currentWallet: () => app.getCurrentWallet(),
		allWallets: () => app.getAllWallets(),
	},
}

import { Block } from "../domain";

export const typeDefs = `
	extend type Query {
		blocks: [Block!]!
		block(id: ID, hash: String): Block
		peers: [Peer!]!
	}

	extend type Mutation {
		addPeer(remoteAddress: String!, port: Int!): Peer
	}

	type Block {
		id: ID!
		hash: String!
	}

	type Peer {
		remoteAddress: String!
		port: Int!
	}
`

export const resolvers = {
	Query: {
		blocks: () => [],
		block: (_, { id, hash }) => null,
		peers: () => [],
	},

	Mutation: {
		addPeer: () => null,
	},

	Block: {
		id: (obj: Block) => obj.index + obj.hash,
	},
}

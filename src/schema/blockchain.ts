import { db, Block, Peer } from "../model";
import * as blockchainDomain from "../domain/blockchain";
import { connectToPeers } from "../infrastructure";
import { run } from "jokio";

export const typeDefs = `
	extend type Query {
		blocks: [Block!]!
		block(index: Int, hash: String): Block
		peers(onlyConnected: Boolean): [Peer!]!
	}

	extend type Mutation {
		addPeer(endpoint: String!): Peer
	}

	type Block {
		id: ID!
		index: Int!
		hash: String!
	}

	type Peer {
		endpoint: String!
		isConnected: Boolean!
	}
`

export const resolvers = {
	Query: {
		blocks: () => db.blocks,
		block: (_, props) => blockchainDomain.findBlock(props)(db.blocks),
		peers: (_, { onlyConnected }) => db.peers.filter(x => !onlyConnected || blockchainDomain.isPeerConnected(x)),
	},

	Mutation: {
		addPeer: async (_, props) => {
			const peer = await connectToPeers(props)

			const dbLoadPeers = () => db.peers
			const dbSavePeers = (newPeers) => db.peers = newPeers

			run(
				dbLoadPeers,
				blockchainDomain.addPeer(peer),
				dbSavePeers,
			)
		},

		mineBlock: () => { },
	},

	Block: {
		id: (obj: Block) => blockchainDomain.getBlockId(obj),
	},

	Peer: {
		isConnected: (obj) => blockchainDomain.isPeerConnected(obj)
	}
}

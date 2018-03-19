import { runWith } from "jokio";
import * as blockchainDomain from "domain/blockchain";
import { connectToPeers } from "infrastructure";
import db, { Block, Peer } from "model";

const run = runWith({ errorFn: err => { throw err } })


export const typeDefs = `
	extend type Query {
		blockchain: [Block!]!
		block(index: Int, hash: String): Block
		peers(onlyConnected: Boolean): [Peer!]!
	}

	extend type Mutation {
		addPeer(endpoint: String!): Peer
		mineBlock(data: JSON!): Block
		# replaceChain(blocks: [BlockInput!]!): Block
		addBlock(block: BlockInput): Block
	}

	type Block {
		id: ID!
		index: Int!
		hash: String!
		createdAt: DateTime!
		data: JSON!
		previousBlock: Block
		nextBlock: Block
	}

	input BlockInput {
		index: Int!
		hash: String!
		timestamp: Int!
		data: JSON!
		previousHash: String!
	}


	type Peer {
		endpoint: String!
		isConnected: Boolean!
	}
`

export const resolvers = {
	Query: {
		blockchain: () => db.loadBlocks(),
		block: (_, props) => db.findBlock(props),
		peers: (_, { onlyConnected }) =>
			db.loadPeers().then(peers => peers.filter(x => !onlyConnected || blockchainDomain.isPeerConnected(x)))
	},

	Mutation: {
		addPeer: async (_, props) => {
			const peer = await connectToPeers(props)

			return run(
				db.loadPeers,
				blockchainDomain.addPeer(peer),
				db.savePeers,
			)
		},

		mineBlock: (_, { data }) => run(
			db.loadBlocks,
			blockchainDomain.generateNextBlock(data),
			db.saveBlocks,
		),

		// replaceChain: (_, { blocks }) => run(
		// 	db.loadBlocks,
		// 	blockchainDomain.replaceChain(blocks),
		// 	db.saveBlocks,
		// ),

		addBlock: (_, { block }) => run(
			db.loadBlocks,
			blockchainDomain.addBlockToChain(block),
			db.saveBlocks,
		)
	},

	Block: {
		id: (obj: Block) => blockchainDomain.getBlockId(obj),
		createdAt: (obj: Block) => new Date(obj.timestamp),
		previousBlock: (obj: Block) => db.findBlock({ hash: obj.previousHash }),
		nextBlock: (obj: Block) => db.findBlock({ previousHash: obj.hash }),
	},

	Peer: {
		isConnected: (obj) => blockchainDomain.isPeerConnected(obj)
	}
}

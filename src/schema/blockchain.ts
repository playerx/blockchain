import { runWith } from "jokio"
import { getBlockchain, findBlock } from 'blockchain'
import { getPeers, connectToPeer } from 'p2p'
import { Block } from "types";

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
		# addBlock(block: BlockInput): Block
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
		blockchain: () => getBlockchain(),
		block: (_, props) => findBlock(props),
		peers: (_, { onlyConnected }) => getPeers(onlyConnected),
	},

	Mutation: {
		addPeer: async (_, { endpoint }) => connectToPeer(endpoint),

		// mineBlock: (_, { data }) => run(
		// 	db.loadBlocks,
		// 	blockchainDomain.generateNextBlock(data),
		// 	db.saveBlocks,
		// ),
	},

	Block: {
		id: (obj: Block) => obj.index + obj.hash,
		createdAt: (obj: Block) => new Date(obj.timestamp),
		previousBlock: (obj: Block) => findBlock({ hash: obj.previousHash }),
		nextBlock: (obj: Block) => findBlock({ previousHash: obj.hash }),
	}
}

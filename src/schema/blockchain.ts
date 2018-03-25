import { runWith } from "jokio"
import { getBlockchain, findBlock, addBlockToChain, generateRawNextBlock, getLatestBlock } from 'blockchain'
import { getPeers, connectToPeer, broadcastLatestBlock } from 'p2p'
import { Block, Peer } from "types";

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
		id: ID!
		name: String!
		connectedAt: DateTime!
		uptimeInMin: Float!
		isConnected: Boolean!
		messages: [JSON]!
	}
`

export const resolvers = {
	Query: {
		blockchain: () => getBlockchain(),
		block: (_, props) => findBlock(props),
		peers: (_, { onlyConnected }) => getPeers(onlyConnected),
	},

	Mutation: {
		addPeer: (_, { endpoint }) => connectToPeer(endpoint),

		mineBlock: (_, { data }) => {
			const newBlock = generateRawNextBlock(data)
			if (!newBlock) {
				throw new Error('Block generation failed')
			}

			broadcastLatestBlock()

			return newBlock
		},
	},

	Block: {
		id: (obj: Block) => `${obj.index}-${obj.hash}`,
		createdAt: (obj: Block) => new Date(obj.timestamp),
		previousBlock: (obj: Block) => findBlock({ hash: obj.previousHash }),
		nextBlock: (obj: Block) => findBlock({ previousHash: obj.hash }),
	},

	Peer: {
		connectedAt: (obj: Peer) => new Date(obj.connectTime),
		uptimeInMin: (obj: Peer) => (Date.now() - obj.connectTime) / (1000 * 60)
	}
}

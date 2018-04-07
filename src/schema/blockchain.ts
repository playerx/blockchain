import * as blockchain from '../domain/blockchain'
import { Block, Peer, BlockType } from "../domain/types";
import * as p2p from '../infrastructure/p2p'


export const typeDefs = `
	extend type Query {
		blockchain: [Block!]!
		lastBlock: Block!
		block(index: Int, hash: String): Block
		peers(onlyConnected: Boolean): [Peer!]!
	}

	extend type Mutation {
		addPeer(endpoint: String!): Peer
		mineCustomBlock(data: JSON!): Block
		validateBlockchain: Boolean
	}

	type Block {
		id: ID!
		type: BlockType!
		index: Int!
		hash: String!
		createdAt: DateTime!
		data: JSON!
		previousBlock: Block
		nextBlock: Block
	}

	enum BlockType {
		GENESIS
		TRANSACTION
		CUSTOM
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
		blockchain: () => blockchain.getBlockchain(),
		lastBlock: () => blockchain.getLatestBlock(),
		block: (_, props) => blockchain.findBlock(props),
		peers: (_, { onlyConnected }) => p2p.getPeers(onlyConnected),
	},

	Mutation: {
		addPeer: (_, { endpoint }) => p2p.connectToPeer(endpoint),

		mineCustomBlock: (_, { data }) => {
			const newBlock = blockchain.generateNextBlockWithData(BlockType.Custom, data, null, null, null)
			if (!newBlock) {
				throw new Error('Block generation failed')
			}

			p2p.broadcastLatestBlock()

			return newBlock
		},

		validateBlockchain: () =>
			blockchain.isValidChain(blockchain.getBlockchain()),
	},

	Block: {
		id: (obj: Block) => `${obj.index}-${obj.hash}`,
		createdAt: (obj: Block) => new Date(obj.timestamp),
		previousBlock: (obj: Block) => blockchain.findBlock({ hash: obj.previousHash }),
		nextBlock: (obj: Block) => blockchain.findBlock({ previousHash: obj.hash }),
	},

	Peer: {
		connectedAt: (obj: Peer) => new Date(obj.connectTime),
		uptimeInMin: (obj: Peer) => (Date.now() - obj.connectTime) / (1000 * 60)
	}
}

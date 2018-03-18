import { Peer, Block, Database } from "./types";

const genesisBlock: Block = {
	index: 0,
	hash: '00000000',
	previousHash: null,
	timestamp: Date.now(),
	data: {
		miners: [
			'ws://localhost:3000/graphql'
		]
	}
}

export const db: Database = {
	peers: [],
	blocks: [genesisBlock],
}

import { Peer, Block } from 'model'
import gql from 'graphql-tag'


export const broadcastLatestBlock = (block: Block) => async (peers: Peer[]) => {
	const mutation = gql`
	mutation addBlock($block: BlockInput!) {
		addBlock(block: $block) {
			index
		}
	}
	`

	const variables = {
		index: block.index,
		hash: block.hash,
		timestamp: block.timestamp,
		data: block.data,
		previousHash: block.previousHash
	}

	for (let peer of peers) {
		try {
			await peer.client.mutate({
				mutation,
				variables
			})
		}
		catch (err) {
			console.log('broadcastLatestBlock - Mutation failed', err)
		}
	}
}

import { Peer, Block, Database } from './types'
import genesisBlock from '../genesis.block'

const db: Database = {
	peers: [],
	blocks: [genesisBlock],
}

const loadPeers = () => Promise.resolve(db.peers)
const savePeers = (newPeers) => Promise.resolve(db.peers = newPeers)

const loadBlocks = () => Promise.resolve(db.blocks)
const saveBlocks = (state) => Promise.resolve(db.blocks = state)
const findBlock = ({ index, hash, previousHash }: FindBlockProps) => {
	const noIndexFilter = index === undefined
	const noHashFilter = hash === undefined
	const noPreviousHashFilter = previousHash === undefined

	const result = db.blocks.filter(x =>
		(noIndexFilter || x.index === index) &&
		(noHashFilter || x.hash === hash) &&
		(noPreviousHashFilter || x.previousHash === previousHash)
	)[0]

	return Promise.resolve(result)
}


export * from './types'

export default {
	loadPeers,
	savePeers,
	loadBlocks,
	saveBlocks,
	findBlock,
}


// Types
export interface FindBlockProps {
	index?: number
	hash?: string
	previousHash?: string
}

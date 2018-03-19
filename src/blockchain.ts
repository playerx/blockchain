import { Block } from 'types';

// genesis block
export const genesisBlock = {
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

// public api
export const getLatestBlock = (): Block => blockchain[blockchain.length - 1]
export const getBlockchain = (): Block[] => blockchain
export const replaceChain = (blocks: Block[]) => {
	if (blocks.length === 0) {
		console.log('received block chain size of 0');
		return false;
	}

	if (!isValidChain(blocks)) {
		console.log('received blockchain is not valid');
		return false;
	}

	blockchain.splice(0, blockchain.length)
	blockchain.push(...blocks)

	return true;
}
export const addBlockToChain = (block: Block) => {
	if (!isValidBlockStructure(block))
		return AddBlockResult.InvalidBlock

	const latestBlock = getLatestBlock()
	if (block.index <= latestBlock.index)
		return AddBlockResult.InvalidIndex

	if (latestBlock.hash !== block.previousHash)
		return AddBlockResult.InvalidPreviousHash

	blockchain.push(block)

	return AddBlockResult.Success
}
export const findBlock = ({ index, hash, previousHash }: FindBlockProps) => {
	const noIndexFilter = index === undefined
	const noHashFilter = hash === undefined
	const noPreviousHashFilter = previousHash === undefined

	const result = blockchain.filter(x =>
		(noIndexFilter || x.index === index) &&
		(noHashFilter || x.hash === hash) &&
		(noPreviousHashFilter || x.previousHash === previousHash)
	)[0]

	return Promise.resolve(result)
}


// types
export enum AddBlockResult {
	InvalidBlock,
	InvalidIndex,
	InvalidPreviousHash,
	Success
}

export interface FindBlockProps {
	index?: number
	hash?: string
	previousHash?: string
}


// internal state
const blockchain: Block[] = [genesisBlock]


// internal functions
const isValidChain = (blocks: Block[]) => true
const isValidBlockStructure = (block: Block) => true

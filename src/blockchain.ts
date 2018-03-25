import * as CryptoJS from 'crypto-js';
import { Block, BlockType } from 'types';


// genesis block
export const genesisBlock = {
	type: BlockType.Genesis,
	index: 0,
	hash: '00000000',
	previousHash: null,
	timestamp: 1521988887397,
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
		console.log('received block chain size of 0')
		return false
	}

	if (!isValidChain(blocks)) {
		console.log('received blockchain is not valid')
		return false
	}

	blockchain.splice(0, blockchain.length)
	blockchain.push(...blocks)

	return true
}
export const addBlockToChain = (block: Block) => {
	const latestBlock = getLatestBlock()
	if (!isValidBlockStructure(block)) {
		console.log(1)
		return false
	}

	if (!isValidNewBlock(block, latestBlock)) {
		console.log(2, block, latestBlock)
		return false
	}

	blockchain.push(block)

	return true
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
export const generateNextBlockWithData = <T>(blockData: T) => {
	const previousBlock: Block = getLatestBlock()
	const nextIndex: number = previousBlock.index + 1
	const nextTimestamp: number = Date.now()
	const newBlock: Block = mineBlock(nextIndex, previousBlock.hash, nextTimestamp, blockData)

	if (!addBlockToChain(newBlock)) {
		return false
	}

	return newBlock
}
export const isValidNewBlock = (newBlock: Block, previousBlock: Block): boolean => {
	if (!isValidBlockStructure(newBlock)) {
		console.log('invalid block structure: %s', JSON.stringify(newBlock))
		return false
	}

	previousBlock = previousBlock
	if (previousBlock.index + 1 !== newBlock.index) {
		console.log('invalid index')
		return false
	}

	if (previousBlock.hash !== newBlock.previousHash) {
		console.log('invalid previoushash')
		return false
	}

	if (!isValidTimestamp(newBlock, previousBlock)) {
		console.log('invalid timestamp')
		return false
	}

	if (!hasValidHash(newBlock)) {
		return false
	}

	return true
}
export const isValidBlockStructure = (block: Block) =>
	typeof block.index === 'number' &&
	typeof block.hash === 'string' &&
	typeof block.previousHash === 'string' &&
	typeof block.timestamp === 'number' &&
	typeof block.data === 'object'

export const isValidChain = (blocks: Block[]) => {
	const isValidGenesis = (block: Block): boolean => {
		return JSON.stringify(block) === JSON.stringify(genesisBlock)
	}

	if (!isValidGenesis(blocks[0])) {
		return null
	}

	/*
	Validate each block in the chain. The block is valid if the block structure is valid
	  and the transaction are valid
	 */
	// let aUnspentTxOuts: UnspentTxOut[] = [];

	for (let i = 0; i < blocks.length; i++) {
		const currentBlock: Block = blocks[i];
		if (i !== 0 && !isValidNewBlock(blocks[i], blocks[i - 1])) {
			return null
		}

		// aUnspentTxOuts = processTransactions(currentBlock.data, aUnspentTxOuts, currentBlock.index);
		// if (aUnspentTxOuts === null) {
		// 	console.log('invalid transactions in blockchain');
		// 	return null;
		// }
	}

	return true
}

// types
export interface FindBlockProps {
	index?: number
	hash?: string
	previousHash?: string
}


// internal state
const blockchain: Block[] = [genesisBlock]


// internal functions
const isValidTimestamp = (newBlock: Block, previousBlock: Block): boolean => {
	return (previousBlock.timestamp < newBlock.timestamp)
		&& (newBlock.timestamp <= Date.now())
}
const hasValidHash = (block: Block): boolean => block.hash === calculateHashForBlock(block)




const mineBlock = <T>(index: number, previousHash: string, timestamp: number, data: T): Block => ({
	type: BlockType.Transaction,
	index,
	data,
	previousHash,
	timestamp,
	hash: calculateHash(index, previousHash, timestamp, data)
})

const calculateHashForBlock = (block: Block): string => calculateHash(block.index, block.previousHash, block.timestamp, block.data);
const calculateHash = (...items: any[]) => CryptoJS.SHA256(items.reduce(objectsToString, '')).toString();
const objectsToString = (r, x) => r += stringify(x)
const stringify = x => (typeof x === 'object') ? JSON.stringify(x) : safeToString(x)
const safeToString = x => (x == null) ? '' : x.toString()

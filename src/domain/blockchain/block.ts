import * as CryptoJS from 'crypto-js'
import { Block } from 'model'
import genesisBlock from 'genesis.block'

export const getBlockId = (block: Block) => `${block.index}_${block.hash}`
export const getLatestBlock = (state: Block[]) => state[state.length - 1]
export const generateNextBlock = (data: any) => (state: Block[]) => {
	const previousBlock = getLatestBlock(state)
	const nextIndex: number = previousBlock.index + 1
	const nextTimestamp: number = Date.now()
	const nextHash: string = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, data)
	const newBlock: Block = {
		index: nextIndex,
		hash: nextHash,
		previousHash: previousBlock.hash,
		timestamp: nextTimestamp,
		data,
	}

	if (!isValidNewBlock(newBlock, previousBlock))
		throw new Error('INVALID_NEW_BLOCK')

	return [...state, newBlock]
}
export const replaceChain = (newBlocks) => (blockchain) => {
	if (isValidChain(newBlocks) && newBlocks.length > blockchain.length) {
		console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
		blockchain = [...newBlocks];
	} else {
		console.log('Received blockchain invalid');
		throw new Error('INVALID_NEW_CHAIN')
	}

	return blockchain;
}
export const addBlockToChain = (newBlock: Block) => (blockchain: Block[]) => {
	if (!isValidNewBlock(newBlock, getLatestBlock(blockchain)))
		throw new Error('INVALID_NEW_STRUCTURE')

	if (false) {
		console.log('block is not valid in terms of transactions')
		throw new Error('INVALID')
	}

	return [...blockchain, newBlock];
}



// Helper functions
const isValidNewBlock = (newBlock: Block, previousBlock: Block): boolean => {
	if (!isValidBlockStructure(newBlock)) {
		console.log('invalid structure')
		return false
	}
	if (previousBlock.index + 1 !== newBlock.index) {
		console.log('invalid index')
		return false
	} else if (previousBlock.hash !== newBlock.previousHash) {
		console.log('invalid previoushash')
		return false
	} else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
		console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock))
		console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash)
		return false
	}
	return true
}
const isValidBlockStructure = (block: Block): boolean =>
	typeof block.index === 'number' &&
	typeof block.hash === 'string' &&
	typeof block.previousHash === 'string' &&
	typeof block.timestamp === 'number' &&
	typeof block.data === 'object'


const calculateHashForBlock = (block: Block): string =>
	calculateHash(block.index, block.previousHash, block.timestamp, block.data)

const calculateHash = (index: number, previousHash: string, timestamp: number, data: any): string =>
	CryptoJS.SHA256(index + previousHash + timestamp + JSON.stringify(data)).toString()
const isValidChain = (blockchainToValidate: Block[]): boolean => {
	const isValidGenesis = (block: Block): boolean => {
		return JSON.stringify(block) === JSON.stringify(genesisBlock)
	}

	if (!isValidGenesis(blockchainToValidate[0])) {
		return false
	}

	for (let i = 1; i < blockchainToValidate.length; i++) {
		if (!isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
			return false
		}
	}
	return true
}

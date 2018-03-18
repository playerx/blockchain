import * as CryptoJS from 'crypto-js'
import { Block } from "../../model"

export const findBlock = ({ index, hash }) => (state: Block[]) => {
	const noIndexFilter = !index && (index !== 0)

	return state.filter(x =>
		(noIndexFilter || x.index === index) &&
		(!hash || x.hash === hash)
	)[0]
}
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
	return addBlock(newBlock)(state)
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
const addBlock = (newBlock: Block) => (state: Block[]) =>
	isValidNewBlock(newBlock, getLatestBlock(state))
		? [...state, newBlock]
		: [...state]
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

import { calculateHash, sign, verify } from './crypto'
import { Block, BlockType, UnspentTxOut } from './types';
import { updateTransactionPool, getUnspentTxOuts } from './transaction-pool';
import { processTransactions } from './transaction';


// genesis block
export const genesisBlock = {
	type: BlockType.Genesis,
	index: 0,
	hash: '000000000',
	previousHash: null,
	timestamp: 1521988887397,
	minerPublicKey: '',
	minerSignature: '',
	minerComment: '',
	data: {
		miners: [
			'0471fd6e57fffea06af51e059fb9c51d4d520439b61386d88cdd9912018dc2947f8909134c10be793f8a6fe44ae238bcbe508f0e2804e1a34801b73cfbc4d34090'
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

	const unspentTxOuts = isValidChain(blocks)
	if (!unspentTxOuts) {
		console.log('received blockchain is not valid')
		return false
	}

	updateTransactionPool(unspentTxOuts)

	blockchain.splice(0, blockchain.length)
	blockchain.push(...blocks)

	return true
}
export const addBlockToChain = (block: Block) => {
	const latestBlock = getLatestBlock()
	if (!isValidBlockStructure(block)) {
		return false
	}

	if (!isValidNewBlock(block, latestBlock)) {
		return false
	}

	const newUnspentTxOuts = processTransactions(block.data, getUnspentTxOuts(), block.index);
	if (!newUnspentTxOuts) {
		return false
	}

	updateTransactionPool(newUnspentTxOuts)
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
export const generateNextBlockWithData = <T>(type: BlockType, blockData: T, privateKey: string, publicKey: string, minerComment: string) => {
	const previousBlock: Block = getLatestBlock()
	const nextIndex: number = previousBlock.index + 1
	const nextTimestamp: number = Date.now()
	const newBlock: Block = mineBlock(
		type,
		nextIndex,
		previousBlock.hash,
		nextTimestamp,
		blockData,
		publicKey,
		privateKey,
		minerComment
	)

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

	if (!isValidMinerSignature(newBlock)) {
		console.log('invalid miner signature on block: %s', JSON.stringify(newBlock))
		return false
	}

	if (!~genesisBlock.data.miners.indexOf(newBlock.minerPublicKey)) {
		console.log('invalid miner, PoA restriction')
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
	typeof block.minerSignature === 'string' &&
	typeof block.data === 'object'

export const isValidMinerSignature = (block: Block) => {
	const signedData = Object.assign({}, block)
	delete signedData['minerSignature']

	const signedDataString = JSON.stringify(signedData)

	return verify(signedDataString, block.minerSignature, block.minerPublicKey)
}

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
	let aUnspentTxOuts: UnspentTxOut[] = [];

	for (let i = 0; i < blocks.length; i++) {
		const currentBlock: Block = blocks[i];
		if (i !== 0 && !isValidNewBlock(blocks[i], blocks[i - 1])) {
			return null
		}

		aUnspentTxOuts = processTransactions(currentBlock.data, aUnspentTxOuts, currentBlock.index);
		if (aUnspentTxOuts === null) {
			console.log('invalid transactions in blockchain');
			return null;
		}
	}

	return aUnspentTxOuts
}


// function types
export interface FindBlockProps {
	index?: number
	hash?: string
	previousHash?: string
}


// internal state
const blockchain: Block[] = [genesisBlock]


// helper functions
const isValidTimestamp = (newBlock: Block, previousBlock: Block): boolean => {
	return (previousBlock.timestamp < newBlock.timestamp)
		&& (newBlock.timestamp <= Date.now())
}
const hasValidHash = (block: Block): boolean => block.hash === calculateHashForBlock(block)

const mineBlock = <T>(type: BlockType, index: number, previousHash: string, timestamp: number, data: T, publicKey, privateKey, minerComment): Block => {
	const block = {
		type,
		index,
		data,
		previousHash,
		timestamp,
		hash: calculateHash(index, previousHash, timestamp, data),
		minerPublicKey: publicKey,
		minerComment,
	}

	const minerSignature = privateKey
		? sign(privateKey, JSON.stringify(block))
		: null

	return {
		...block,
		minerSignature,
	};
}

const calculateHashForBlock = (block: Block): string => calculateHash(block.index, block.previousHash, block.timestamp, block.data);


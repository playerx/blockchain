import { getLatestBlock, generateNextBlockWithData } from './domain/blockchain'
import { getRewardTransaction } from './domain/transaction'
import { getTransactionPool, addToTransactionPool } from './domain/transaction-pool'
import { getPublicKey, createTransaction } from './domain/wallet'
import config from './config'


let autoBuildTimer = null

// TODO: move somewhere
const getUnspentTxOuts = () => []


// public api
export const requestAutoBuildNextBlock = () => {
	clearTimeout(autoBuildTimer)
	autoBuildTimer = setTimeout(() => generateNextBlock(), config.maxTxCountInBlock * 1000)
}

export const makeTransfer = (toAddress, amount, description = '') => {
	const transactionPool = getTransactionPool()
	const unspentTxOuts = getUnspentTxOuts()
	const tx = createTransaction(toAddress, amount, unspentTxOuts, transactionPool, description)
	const length = addToTransactionPool(tx, unspentTxOuts)

	if (length < config.maxTxCountInBlock) {
		// TODO: broadcast transaction pool
		return
	}

	const block = generateNextBlock()
	if (block) {
		// TODO: breadcast latest block
		requestAutoBuildNextBlock()
	}
}


const generateNextBlock = () => {
	const rewardTx = getRewardTransaction(getPublicKey(), getLatestBlock().index + 1, config.rewardCoins)
	const blockData = [rewardTx].concat(getTransactionPool())
	return generateNextBlockWithData(blockData)
}

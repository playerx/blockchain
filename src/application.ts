import { getLatestBlock, generateNextBlockWithData, getBlockchain } from './domain/blockchain'
import { getRewardTransaction, createTransaction, setRewardAmount } from './domain/transaction'
import { getTransactionPool, addToTransactionPool, getUnspentTxOuts } from './domain/transaction-pool'
import * as wallet from './domain/wallet'
import config from './config'
import { BlockType, Transaction } from 'domain/types';


let autoBuildTimer = null


// public api
export const requestAutoBuildNextBlock = () => {

	const doWork = () => {
		const address = wallet.getPublicKey()
		const description = 'Congrats! Reward received.'

		const rewardTx = getRewardTransaction(
			address,
			getLatestBlock().index + 1,
			config.rewardCoins,
			description
		)

		generateNextBlock(rewardTx)
		requestAutoBuildNextBlock()
	}

	clearTimeout(autoBuildTimer)
	autoBuildTimer = setTimeout(doWork, config.blockBuildIntervalInSec * 1000)
}

export const makeTransfer = ({ fromAddress, toAddress, amount, description = '', privateKey }) => {
	const publicKey = fromAddress
	const transactionPool = getTransactionPool()
	const unspentTxOuts = getUnspentTxOuts()

	const tx = createTransaction(
		fromAddress,
		toAddress,
		amount,
		unspentTxOuts,
		transactionPool,
		description,
		publicKey,
		privateKey
	)

	const length = addToTransactionPool(tx, unspentTxOuts)

	onTransactionAdded(length)

	return tx;
}

export const addBalance = (address: string, description = '') => {
	const unspentTxOuts = getUnspentTxOuts()
	const rewardTx = getRewardTransaction(
		address,
		getLatestBlock().index + 1,
		config.rewardCoins,
		description
	)
	const length = addToTransactionPool(rewardTx, unspentTxOuts)

	onTransactionAdded(length)

	return rewardTx;
}

export const getBalance = (address: string) => {
	return wallet.getBalance(address, getUnspentTxOuts())
}

export const getCurrentWallet = () => {
	return {
		publicKey: wallet.getPublicKey(),
		privateKey: wallet.getPrivateKey(),
	}
}

export const findTransaction = (id) => {
	const blocks = getBlockchain()
	for (let block of blocks) {
		if (block.type !== BlockType.Transaction) {
			continue
		}

		const transactions: Transaction[] = block.data
		const result = transactions.find(y => y.id === id)
		if (!result) {
			continue
		}

		return result
	}
}

export const start = () => {
	setRewardAmount(config.rewardCoins)
	wallet.initWallet()
	requestAutoBuildNextBlock()
}


// events
const onTransactionAdded = (transactionPoolLength) => {

	if (transactionPoolLength < config.minTxCountInBlock) {
		// TODO: broadcast transaction pool
		return
	}

	const block = generateNextBlock()
	if (block) {
		// TODO: breadcast latest block
		requestAutoBuildNextBlock()
	}
}


// helper functions
const generateNextBlock = (rewardTx = null) => {
	let transactions = getTransactionPool()
	if (rewardTx) {
		transactions.unshift(rewardTx)
	}

	return generateNextBlockWithData(transactions)
}

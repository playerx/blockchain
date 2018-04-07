import config from './config'
import * as wallet from './domain/wallet'
import * as p2p from './infrastructure/p2p'
import { BlockType, Transaction } from 'domain/types';
import { getLatestBlock, generateNextBlockWithData, getBlockchain } from './domain/blockchain'
import { getRewardTransaction, createTransaction, setRewardAmount } from './domain/transaction'
import { getTransactionPool, addToTransactionPool, getUnspentTxOuts } from './domain/transaction-pool'


let autoBuildTimer = null


// public api
export const requestAutoBuildNextBlock = () => {
	clearTimeout(autoBuildTimer)
	autoBuildTimer = setTimeout(() => mineNextBlock(), config.blockBuildIntervalInSec * 1000)
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

export const mineNextBlock = (address = null, rewardTxDescription = 'Congrats! Reward received.') => {
	const defaultAddress = wallet.getPublicKey()

	const rewardTx = getRewardTransaction(
		address || defaultAddress,
		getLatestBlock().index + 1,
		config.rewardCoins,
		rewardTxDescription
	)

	let transactions = getTransactionPool()
	if (rewardTx) {
		transactions.unshift(rewardTx)
	}

	const block = generateNextBlockWithData(
		BlockType.Transaction,
		transactions,
		wallet.getPrivateKey(),
		wallet.getPublicKey(),
		'Mined by me!'
	)

	if (!block) return


	onBlockAdded(block)

	requestAutoBuildNextBlock()

	return block
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

	mineNextBlock()
}

const onBlockAdded = (block) => {
	p2p.broadcastLatestBlock()
}

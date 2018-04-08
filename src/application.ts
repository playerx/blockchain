import config from './config'
import * as wallet from './domain/wallet'
import * as p2p from './infrastructure/p2p'
import { BlockType, Transaction, Wallet } from 'domain/types';
import { getLatestBlock, generateNextBlockWithData, getBlockchain, genesisBlock } from './domain/blockchain'
import { getRewardTransaction, createTransaction, setRewardAmount } from './domain/transaction'
import { getTransactionPool, addToTransactionPool, getUnspentTxOuts } from './domain/transaction-pool'


let autoBuildTimer = null


// public api
export const requestAutoBuildNextBlock = () => {
	clearTimeout(autoBuildTimer)
	autoBuildTimer = setTimeout(() => mineNextBlock(), config.blockAutoBuildIntervalInSec * 1000)
}

export const makeTransfer = ({ toAddress, amount, description = '' }) => {
	const publicKey = wallet.getPublicKey()
	const privateKey = wallet.getPrivateKey()
	const transactionPool = getTransactionPool()
	const unspentTxOuts = getUnspentTxOuts()
	const fromAddress = publicKey

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

export const getCurrentWallet = (): Wallet => {
	return {
		address: wallet.getPublicKey(),
		balance: getBalance(wallet.getPublicKey()),
		privateKey: wallet.getPrivateKey(),
	}
}

export const getAllWallets = (): Wallet[] => {
	const unspentTxOuts = getUnspentTxOuts()

	return unspentTxOuts.reduce((r, x) => {
		let wallet: Wallet = r.find(y => y.address === x.address)
		if (!wallet) {
			wallet = {
				address: x.address,
				balance: 0,
			}

			r.push(wallet)
		}

		wallet.balance += x.amount

		return r
	}, [])
}

export const findTransaction = (id, blockIndex = null) => {
	const blocks = getBlockchain()

	if (blockIndex) {
		const block = blocks.find(x => x.index === blockIndex)
		if (block) {
			const transactions: Transaction[] = block.data
			const result = transactions.find(y => y.id === id)
			if (result) {
				return result
			}
		}
	}

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

export const start = (privateKey: string, domain: string) => {
	setRewardAmount(config.rewardCoins)
	wallet.initWallet(privateKey)
	requestAutoBuildNextBlock()

	p2p.setTransactionAddedHandler(onTransactionAdded)

	genesisBlock.data.autoConnectUrls
		.filter(endpoint => !~endpoint.indexOf(domain))
		.forEach(endpoint => p2p.connectToPeer(endpoint))
}



// events
const onTransactionAdded = (transactionPoolLength) => {

	p2p.broadcastTransactionPool()

	if (transactionPoolLength < config.minTxCountInBlockToBuild) {
		return
	}

	mineNextBlock()
}

const onBlockAdded = (_) => {
	p2p.broadcastLatestBlock()
}

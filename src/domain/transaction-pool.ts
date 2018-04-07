import * as _ from 'lodash'
import { validateTransaction } from './transaction'
import { Transaction, UnspentTxOut, TxIn } from './types'


let transactionPool: Transaction[] = []
let unspentTxOuts: UnspentTxOut[] = []

// public api
export const getTransactionPool = (): Transaction[] => {
	return _.cloneDeep(transactionPool)
}

export const getUnspentTxOuts = () => {
	return _.cloneDeep(unspentTxOuts)
}

export const addToTransactionPool = (tx: Transaction, unspentTxOuts: UnspentTxOut[]) => {

	if (!validateTransaction(tx, unspentTxOuts)) {
		throw Error('Trying to add invalid tx to pool')
	}

	if (!isValidTxForPool(tx, transactionPool)) {
		throw Error('Trying to add invalid tx to pool 2')
	}

	console.log('adding to txPool: %s', JSON.stringify(tx))
	transactionPool.push(tx)

	return transactionPool.length
}

export const updateTransactionPool = (newUnspentTxOut: UnspentTxOut[]) => {
	unspentTxOuts = newUnspentTxOut;

	const invalidTxs = [];
	for (const tx of transactionPool) {
		for (const txIn of tx.txIns) {
			if (!hasTxIn(txIn, unspentTxOuts)) {
				invalidTxs.push(tx);
				break;
			}
		}
	}

	if (invalidTxs.length > 0) {
		console.log('removing the following transactions from txPool: %s', JSON.stringify(invalidTxs));
		transactionPool = _.without(transactionPool, ...invalidTxs);
	}
}


// validation functions
const isValidTxForPool = (tx: Transaction, aTtransactionPool: Transaction[]): boolean => {
	const txPoolIns: TxIn[] = getTxPoolIns(aTtransactionPool);

	const containsTxIn = (txIns: TxIn[], txIn: TxIn) => {
		return _.find(txIns, ((txPoolIn) => {
			return txIn.txOutIndex === txPoolIn.txOutIndex && txIn.txOutId === txPoolIn.txOutId;
		}));
	};

	for (const txIn of tx.txIns) {
		if (containsTxIn(txPoolIns, txIn)) {
			console.log('txIn already found in the txPool');
			return false;
		}
	}
	return true;
}


// helper functions
const hasTxIn = (txIn: TxIn, unspentTxOuts: UnspentTxOut[]): boolean => {
	const foundTxIn = unspentTxOuts.find((uTxO: UnspentTxOut) => {
		return uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex
	})
	return foundTxIn !== undefined
}

const getTxPoolIns = (aTransactionPool: Transaction[]): TxIn[] => {
	return _(aTransactionPool)
		.map((tx) => tx.txIns)
		.flatten()
		.value()
}

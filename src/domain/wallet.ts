import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import * as _ from 'lodash'
import { getTransactionId, signTxIn } from './transaction'
import { getTransactionPool, addToTransactionPool } from './transaction-pool'
import { UnspentTxOut, Transaction, TxIn, TxOut } from './types'
import * as crypto from './crypto'

const privateKeyLocation = process.env.PRIVATE_KEY || 'wallet/private_key'



// public api
export const getPrivateKey = (): string => {
	if (!existsSync(privateKeyLocation)) {
		throw new Error('Private key doesnt exists')
	}

	const buffer = readFileSync(privateKeyLocation, 'utf8');
	return buffer.toString();
}

export const getPublicKey = (): string => {
	if (!existsSync(privateKeyLocation)) {
		throw new Error('Private key doesnt exists')
	}

	const privateKey = getPrivateKey();

	return crypto.generatePublicKey(privateKey)
}

export const initWallet = () => {
	if (existsSync(privateKeyLocation)) {
		return;
	}

	const newPrivateKey = crypto.generatePrivateKey()

	writeFileSync(privateKeyLocation, newPrivateKey);
}

export const deleteWallet = () => {
	if (existsSync(privateKeyLocation)) {
		unlinkSync(privateKeyLocation);
	}
}

export const getBalance = (address: string, unspentTxOuts: UnspentTxOut[]): number => {
	return _(findUnspentTxOuts(address, unspentTxOuts))
		.map((uTxO: UnspentTxOut) => uTxO.amount)
		.sum();
}

export const createTransaction = (receiverAddress: string, amount: number, unspentTxOuts: UnspentTxOut[], txPool: Transaction[], description): Transaction => {

	console.log('txPool: %s', JSON.stringify(txPool));
	const myAddress: string = getPublicKey();
	const myUnspentTxOutsA = unspentTxOuts.filter((uTxO: UnspentTxOut) => uTxO.address === myAddress);

	const myUnspentTxOuts = filterTxPoolTxs(myUnspentTxOutsA, txPool);

	// filter from unspentOutputs such inputs that are referenced in pool
	const { includedUnspentTxOuts, leftOverAmount } = findTxOutsForAmount(amount, myUnspentTxOuts);

	const toUnsignedTxIn = (unspentTxOut: UnspentTxOut) => {
		const txIn: TxIn = {
			txOutId: unspentTxOut.txOutId,
			txOutIndex: unspentTxOut.txOutIndex,
			signature: '',
		}
		return txIn;
	}

	const unsignedTxIns: TxIn[] = includedUnspentTxOuts.map(toUnsignedTxIn);

	const tx: Transaction = {
		id: '',
		txIns: unsignedTxIns,
		txOuts: createTxOuts(receiverAddress, myAddress, amount, leftOverAmount),
		description
	}

	const publicKey = getPublicKey()
	const privateKey = getPrivateKey()

	tx.id = getTransactionId(tx)

	tx.txIns = tx.txIns.map((txIn: TxIn, index: number) => {
		txIn.signature = signTxIn(tx, index, publicKey, privateKey, unspentTxOuts)
		return txIn
	})

	return tx
}


// helper functions
const findUnspentTxOuts = (ownerAddress: string, unspentTxOuts: UnspentTxOut[]) => {
	return _.filter(unspentTxOuts, (uTxO: UnspentTxOut) => uTxO.address === ownerAddress);
}

const findTxOutsForAmount = (amount: number, myUnspentTxOuts: UnspentTxOut[]) => {
	let currentAmount = 0;
	const includedUnspentTxOuts = [];
	for (const myUnspentTxOut of myUnspentTxOuts) {
		includedUnspentTxOuts.push(myUnspentTxOut);
		currentAmount = currentAmount + myUnspentTxOut.amount;
		if (currentAmount >= amount) {
			const leftOverAmount = currentAmount - amount;
			return { includedUnspentTxOuts, leftOverAmount };
		}
	}

	const eMsg = 'Cannot create transaction from the available unspent transaction outputs.' +
		' Required amount:' + amount + '. Available unspentTxOuts:' + JSON.stringify(myUnspentTxOuts);
	throw Error(eMsg);
}

const createTxOuts = (receiverAddress: string, myAddress: string, amount, leftOverAmount: number) => {
	const txOut1: TxOut = { address: receiverAddress, amount }
	if (leftOverAmount === 0) {
		return [txOut1];
	} else {
		const leftOverTx = { address: myAddress, amount: leftOverAmount }
		return [txOut1, leftOverTx];
	}
}

const filterTxPoolTxs = (unspentTxOuts: UnspentTxOut[], transactionPool: Transaction[]): UnspentTxOut[] => {
	const txIns: TxIn[] = _(transactionPool)
		.map((tx: Transaction) => tx.txIns)
		.flatten()
		.value();
	const removable: UnspentTxOut[] = [];
	for (const unspentTxOut of unspentTxOuts) {
		const txIn = _.find(txIns, (aTxIn: TxIn) => {
			return aTxIn.txOutIndex === unspentTxOut.txOutIndex && aTxIn.txOutId === unspentTxOut.txOutId;
		});

		if (txIn === undefined) {

		} else {
			removable.push(unspentTxOut);
		}
	}

	return _.without(unspentTxOuts, ...removable);
}

import { Transaction, TxIn, TxOut, UnspentTxOut } from './types'
import * as crypto from './crypto'


// public api
export const getTransactionId = (transaction: Transaction): string => {
	const txInContent: string = transaction.txIns
		.map((txIn: TxIn) => txIn.txOutId + txIn.txOutIndex)
		.reduce((a, b) => a + b, '');

	const txOutContent: string = transaction.txOuts
		.map((txOut: TxOut) => txOut.address + txOut.amount)
		.reduce((a, b) => a + b, '');

	return crypto.calculateHash(txInContent + txOutContent)
}

export const getRewardTransaction = (address: string, blockIndex: number, rewardAmount): Transaction => {
	const txIn: TxIn = {
		signature: '',
		txOutId: '',
		txOutIndex: blockIndex
	}

	const txOut: TxOut = {
		address,
		amount: rewardAmount
	}

	const t: Transaction = {
		id: '',
		txIns: [txIn],
		txOuts: [txOut]
	}

	t.id = getTransactionId(t)

	return t
}

export const signTxIn = (transaction: Transaction, txInIndex: number, publicKey: string, privateKey: string, aUnspentTxOuts: UnspentTxOut[]): string => {
	const txIn: TxIn = transaction.txIns[txInIndex];

	const dataToSign = transaction.id;
	const referencedUnspentTxOut: UnspentTxOut = findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts);
	if (referencedUnspentTxOut == null) {
		console.log('could not find referenced txOut');
		throw Error();
	}
	const referencedAddress = referencedUnspentTxOut.address;

	if (publicKey !== referencedAddress) {
		console.log('trying to sign an input with private' +
			' key that does not match the address that is referenced in txIn');
		throw Error();
	}

	const signature = crypto.sign(privateKey, dataToSign)
	return signature;
}

export const validateTransaction = (transaction: Transaction, aUnspentTxOuts: UnspentTxOut[]): boolean => {

	if (getTransactionId(transaction) !== transaction.id) {
		console.log('invalid tx id: ' + transaction.id);
		return false;
	}

	const hasValidTxIns: boolean = transaction.txIns
		.map((txIn) => validateTxIn(txIn, transaction, aUnspentTxOuts))
		.reduce((a, b) => a && b, true);

	if (!hasValidTxIns) {
		console.log('some of the txIns are invalid in tx: ' + transaction.id);
		return false;
	}

	const totalTxInValues: number = transaction.txIns
		.map((txIn) => getTxInAmount(txIn, aUnspentTxOuts))
		.reduce((a, b) => (a + b), 0);

	const totalTxOutValues: number = transaction.txOuts
		.map((txOut) => txOut.amount)
		.reduce((a, b) => (a + b), 0);

	if (totalTxOutValues !== totalTxInValues) {
		console.log('totalTxOutValues !== totalTxInValues in tx: ' + transaction.id);
		return false;
	}

	return true;
}


// validation functions
const validateTxIn = (txIn: TxIn, transaction: Transaction, aUnspentTxOuts: UnspentTxOut[]): boolean => {
	const referencedUTxOut: UnspentTxOut =
		aUnspentTxOuts.find((uTxO) => uTxO.txOutId === txIn.txOutId && uTxO.txOutId === txIn.txOutId);
	if (referencedUTxOut == null) {
		console.log('referenced txOut not found: ' + JSON.stringify(txIn));
		return false;
	}
	const address = referencedUTxOut.address;

	return crypto.verify(transaction.id, txIn.signature, address)
}


// Helper
const findUnspentTxOut = (transactionId: string, index: number, aUnspentTxOuts: UnspentTxOut[]): UnspentTxOut => {
	return aUnspentTxOuts.find((uTxO) => uTxO.txOutId === transactionId && uTxO.txOutIndex === index);
}

const getTxInAmount = (txIn: TxIn, aUnspentTxOuts: UnspentTxOut[]): number => {
	return findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts).amount;
}

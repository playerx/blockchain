import { Transaction, TxIn, TxOut, UnspentTxOut } from './types'
import * as _ from 'lodash'
import * as crypto from './crypto'


let REWARD_AMOUNT = null


// public api
export const setRewardAmount = (amount) => {
	REWARD_AMOUNT = amount
}

export const getTransactionId = (transaction: Transaction): string => {
	const txInContent: string = transaction.txIns
		.map((txIn: TxIn) => txIn.txOutId + txIn.txOutIndex)
		.reduce((a, b) => a + b, '')

	const txOutContent: string = transaction.txOuts
		.map((txOut: TxOut) => txOut.address + txOut.amount)
		.reduce((a, b) => a + b, '')

	return crypto.calculateHash(txInContent + txOutContent + (transaction.description || ''))
}

export const getRewardTransaction = (address: string, blockIndex: number, rewardAmount, description: string = ''): Transaction => {
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
		txOuts: [txOut],
		description,
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
	return signature
}

export const validateTransaction = (transaction: Transaction, aUnspentTxOuts: UnspentTxOut[]): boolean => {

	if (getTransactionId(transaction) !== transaction.id) {
		console.log('invalid tx id: ' + transaction.id);
		return false
	}

	const hasValidTxIns: boolean = transaction.txIns
		.map((txIn) => validateTxIn(txIn, transaction, aUnspentTxOuts))
		.reduce((a, b) => a && b, true)

	if (!hasValidTxIns) {
		console.log('some of the txIns are invalid in tx: ' + transaction.id)
		return false
	}

	const totalTxInValues: number = transaction.txIns
		.map((txIn) => getTxInAmount(txIn, aUnspentTxOuts))
		.reduce((a, b) => (a + b), 0)

	const totalTxOutValues: number = transaction.txOuts
		.map((txOut) => txOut.amount)
		.reduce((a, b) => (a + b), 0)

	if (totalTxOutValues !== totalTxInValues) {
		console.log('totalTxOutValues !== totalTxInValues in tx: ' + transaction.id)
		return false
	}

	return true
}

export const createTransaction = (senderAddress: string, receiverAddress: string, amount: number, unspentTxOuts: UnspentTxOut[], txPool: Transaction[], description, publicKey, privateKey): Transaction => {

	// console.log('txPool: %s', JSON.stringify(txPool));
	const senderUnspentTxOutsA = unspentTxOuts.filter((uTxO: UnspentTxOut) => uTxO.address === senderAddress);
	const senderUnspentTxOuts = filterTxPoolTxs(senderUnspentTxOutsA, txPool);

	// filter from unspentOutputs such inputs that are referenced in pool
	const { includedUnspentTxOuts, leftOverAmount } = findTxOutsForAmount(amount, senderUnspentTxOuts);

	const toUnsignedTxIn = (unspentTxOut: UnspentTxOut) => {
		console.log(unspentTxOut)
		const txIn: TxIn = {
			txOutId: unspentTxOut.txOutId,
			txOutIndex: unspentTxOut.txOutIndex,
			signature: '',
		}
		return txIn
	}

	const unsignedTxIns: TxIn[] = includedUnspentTxOuts.map(toUnsignedTxIn);

	const tx: Transaction = {
		id: '',
		txIns: unsignedTxIns,
		txOuts: createTxOuts(receiverAddress, senderAddress, amount, leftOverAmount),
		description
	}

	tx.id = getTransactionId(tx)

	tx.txIns = tx.txIns.map((txIn: TxIn, index: number) => {
		txIn.signature = signTxIn(tx, index, publicKey, privateKey, unspentTxOuts)
		return txIn
	})

	return tx
}

export const processTransactions = (aTransactions: Transaction[], aUnspentTxOuts: UnspentTxOut[], blockIndex: number) => {

	if (!validateBlockTransactions(aTransactions, aUnspentTxOuts, blockIndex)) {
		console.log('invalid block transactions');
		return null;
	}

	return updateUnspentTxOuts(aTransactions, aUnspentTxOuts, blockIndex);
}



// validation functions
const validateTxIn = (txIn: TxIn, transaction: Transaction, unspentTxOuts: UnspentTxOut[]): boolean => {
	const referencedUTxOut = unspentTxOuts.find(x => (x.txOutId === txIn.txOutId) && (x.txOutIndex === txIn.txOutIndex))
	if (referencedUTxOut == null) {
		console.log('referenced txOut not found: ' + JSON.stringify(txIn))
		return false
	}

	const publicKey = referencedUTxOut.address

	const validSignature = crypto.verify(transaction.id, txIn.signature, publicKey)
	if (!validSignature) {
		console.log('invalid txIn signature: %s txId: %s address: %s', txIn.signature, transaction.id, referencedUTxOut.address)
		return false
	}

	return true
}

const validateBlockTransactions = (aTransactions: Transaction[], aUnspentTxOuts: UnspentTxOut[], blockIndex: number): boolean => {
	const rewardTx = aTransactions[0];
	if (!validateRewardTx(rewardTx, blockIndex)) {
		console.log('invalid reward transaction: ' + JSON.stringify(rewardTx))
		return false
	}

	// check for duplicate txIns. Each txIn can be included only once
	const txIns: TxIn[] = _(aTransactions)
		.map((tx) => tx.txIns)
		.flatten()
		.value()

	if (hasDuplicates(txIns)) {
		return false
	}

	// all but coinbase transactions
	const normalTransactions: Transaction[] = aTransactions.slice(1);
	return normalTransactions.map((tx) => validateTransaction(tx, aUnspentTxOuts))
		.reduce((a, b) => (a && b), true);

}

const validateRewardTx = (transaction: Transaction, blockIndex: number): boolean => {
	if (transaction == null) {
		console.log('the first transaction in the block must be coinbase transaction');
		return false;
	}
	if (getTransactionId(transaction) !== transaction.id) {
		console.log('invalid coinbase tx id: ' + transaction.id);
		return false;
	}
	if (transaction.txIns.length !== 1) {
		console.log('one txIn must be specified in the coinbase transaction');
		return;
	}
	if (transaction.txIns[0].txOutIndex !== blockIndex) {
		console.log('the txIn signature in coinbase tx must be the block height');
		return false;
	}
	if (transaction.txOuts.length !== 1) {
		console.log('invalid number of txOuts in coinbase transaction');
		return false;
	}
	if (transaction.txOuts[0].amount !== REWARD_AMOUNT) {
		console.log('invalid coinbase amount in coinbase transaction');
		return false;
	}
	return true;
}



// Helper
const updateUnspentTxOuts = (aTransactions: Transaction[], aUnspentTxOuts: UnspentTxOut[], blockIndex: number): UnspentTxOut[] => {
	const newUnspentTxOuts: UnspentTxOut[] = aTransactions
		.map((t) => {
			return t.txOuts.map((txOut) => ({
				txOutId: t.id,
				txOutIndex: blockIndex,
				address: txOut.address,
				amount: txOut.amount
			}))
		})
		.reduce((a, b) => a.concat(b), []);

	const consumedTxOuts: UnspentTxOut[] = aTransactions
		.map((t) => t.txIns)
		.reduce((a, b) => a.concat(b), [])
		.map((txIn) => ({
			txOutId: txIn.txOutId,
			txOutIndex: txIn.txOutIndex,
			address: '',
			amount: 0
		}));

	const resultingUnspentTxOuts = aUnspentTxOuts
		.filter(((uTxO) => !findUnspentTxOut(uTxO.txOutId, uTxO.txOutIndex, consumedTxOuts)))
		.concat(newUnspentTxOuts);

	return resultingUnspentTxOuts;
}

const findUnspentTxOut = (transactionId: string, index: number, aUnspentTxOuts: UnspentTxOut[]): UnspentTxOut => {
	return aUnspentTxOuts.find((uTxO) => uTxO.txOutId === transactionId && uTxO.txOutIndex === index);
}

const getTxInAmount = (txIn: TxIn, aUnspentTxOuts: UnspentTxOut[]): number => {
	return findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts).amount;
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

const createTxOuts = (receiverAddress: string, myAddress: string, amount, leftOverAmount: number) => {
	const txOut1: TxOut = { address: receiverAddress, amount }
	if (leftOverAmount === 0) {
		return [txOut1];
	} else {
		const leftOverTx = { address: myAddress, amount: leftOverAmount }
		return [txOut1, leftOverTx];
	}
}

const hasDuplicates = (txIns: TxIn[]): boolean => {
	const groups = _.countBy(txIns, (txIn: TxIn) => txIn.txOutId + txIn.txOutIndex)

	return _(groups)
		.map((value, key) => {
			if (value > 1) {
				console.log('duplicate txIn: ' + key)
				return true
			} else {
				return false
			}
		})
		.includes(true)
}

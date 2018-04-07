import { existsSync, readFileSync, unlinkSync, writeFileSync, mkdirSync, mkdir } from 'fs'
import * as _ from 'lodash'
import { UnspentTxOut } from './types'
import * as crypto from './crypto'

const privateKeyLocation = process.env.PRIVATE_KEY || 'wallet/private.key'



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
		return
	}

	const newPrivateKey = crypto.generatePrivateKey()

	if (!existsSync('wallet/')) {
		mkdirSync('wallet')
	}

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


// helper functions
const findUnspentTxOuts = (ownerAddress: string, unspentTxOuts: UnspentTxOut[]) => {
	return _.filter(unspentTxOuts, (uTxO: UnspentTxOut) => uTxO.address === ownerAddress);
}

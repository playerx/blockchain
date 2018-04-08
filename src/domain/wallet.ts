import { existsSync, readFileSync, unlinkSync, writeFileSync, mkdirSync } from 'fs'
import { UnspentTxOut } from './types'
import * as crypto from './crypto'

const privateKeyLocation = process.env.PRIVATE_KEY || 'wallet/private.key'
let privateKey;


// public api
export const getPrivateKey = (): string => {
	if (!privateKey) {
		throw new Error('Private key doesnt exists')
	}

	return privateKey;
}

export const getPublicKey = (): string => {
	const privateKey = getPrivateKey();

	return crypto.generatePublicKey(privateKey)
}

export const initWallet = (key) => {
	privateKey = key

	if (privateKey) {
		return
	}

	if (!existsSync(privateKeyLocation)) {
		const newPrivateKey = crypto.generatePrivateKey()

		if (!existsSync('wallet/')) {
			mkdirSync('wallet')
		}

		writeFileSync(privateKeyLocation, newPrivateKey);
	}

	const buffer = readFileSync(privateKeyLocation, 'utf8');
	privateKey = buffer.toString();
}

export const deleteWallet = () => {
	if (existsSync(privateKeyLocation)) {
		unlinkSync(privateKeyLocation);
	}
}

export const getBalance = (address: string, unspentTxOuts: UnspentTxOut[]): number => {
	return unspentTxOuts
		.filter(x => x.address === address)
		.map(x => x.amount)
		.reduce((a, b) => a + b, 0)
}

import * as CryptoJS from 'crypto-js';
import * as ecdsa from 'elliptic';

const ec = new ecdsa.ec('secp256k1')


// public api
export const sign = (privateKey, dataToSign) => {
	const key = ec.keyFromPrivate(privateKey, 'hex')
	const signature: string = toHexString(key.sign(dataToSign).toDER())

	return signature
}

export const generatePublicKey = (privateKey) => {
	const key = ec.keyFromPrivate(privateKey, 'hex');
	return key.getPublic().encode('hex');
}

export const generatePrivateKey = (): string => {
	const keyPair = ec.genKeyPair();
	const privateKey = keyPair.getPrivate();
	return privateKey.toString(16);
}

export const verify = (dataToVerify, signature, publicKey) => {
	const key = ec.keyFromPublic(publicKey, 'hex');
	return key.verify(dataToVerify.id, signature);
}

export const calculateHash = (...objects: any[]) => {
	return CryptoJS.SHA256(objects.reduce(objectsToString, '')).toString();
}


// helper functions
const toHexString = (byteArray): string => {
	return Array.from(byteArray, (byte: any) => {
		return ('0' + (byte & 0xFF).toString(16)).slice(-2)
	}).join('')
}

const objectsToString = (r, x) => r += stringify(x)
const stringify = x => (typeof x === 'object') ? JSON.stringify(x) : safeToString(x)
const safeToString = x => (x == null) ? '' : x.toString()

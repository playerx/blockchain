import { Transaction } from './core/types';
import {
	getLatestBlock,
	getRewardTransaction,
	getTransactionPool,
	getPublicKey,
	generateNextBlockWithData
} from './core';


const REWARD_COINS = 500;


const generateNextBlock = () => {
	const rewardTx: Transaction = getRewardTransaction(getPublicKey(), getLatestBlock().index + 1, REWARD_COINS)
	const blockData: Transaction[] = [rewardTx].concat(getTransactionPool())
	return generateNextBlockWithData(blockData)
};

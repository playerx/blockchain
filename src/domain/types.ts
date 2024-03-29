
// Blockchain
export interface Block<T = any> {
	index: number
	hash: string
	previousHash: string
	timestamp: number
	type: BlockType
	data: T
	minerPublicKey: string
	minerComment: string
	minerSignature: string
}

export enum BlockType {
	Genesis = 'GENESIS',
	Transaction = 'TRANSACTION',
	Custom = 'CUSTOM',
}

export interface Peer {
	id: string
	connectTime: number
	isConnected: boolean
	messages: Message[]
}


// Messages
export enum MessageType {
	REQUEST_LATEST = 'QUERY_LATEST',
	REQUEST_CHAIN = 'QUERY_ALL',
	RECEIVED_LATEST_BLOCK = 'RECEIVED_LATEST_BLOCK',
	RECEIVED_CHAIN = 'RECEIVED_BLOCKCHAIN',

	REQUEST_TRANPOOL = 'REQUEST_TRANPOOL',
	RECEIVED_TRANPOOL = 'RECEIVED_TRANPOOL',
}

export interface QueryLatestMessage {
	type: MessageType.REQUEST_LATEST
}

export interface QueryAllMessage {
	type: MessageType.REQUEST_CHAIN
}

export interface AddBlockMessage {
	type: MessageType.RECEIVED_LATEST_BLOCK
	block: Block
}

export interface ResponseBlockchainMessage {
	type: MessageType.RECEIVED_CHAIN
	blocks: Block[]
}

export interface QueryTransactionPool {
	type: MessageType.REQUEST_TRANPOOL
}

export interface ResponseTransactionPool {
	type: MessageType.RECEIVED_TRANPOOL
	transactions: Transaction[]
}

export interface MessageBase {
	receiveTime?: number
}

export type Message = MessageBase &
	(
		QueryLatestMessage |
		QueryAllMessage |
		AddBlockMessage |
		ResponseBlockchainMessage |
		QueryTransactionPool |
		ResponseTransactionPool
	)



// Transactions
export interface TxIn {
	txOutId: string
	txOutIndex: number
	txOutAddress: string
	signature: string
}

export interface TxOut {
	address: string
	amount: number
}

export interface Transaction {
	id: string
	txIns: TxIn[]
	txOuts: TxOut[]
	description?: string
}

export interface UnspentTxOut {
	readonly txOutId: string
	readonly txOutIndex: number
	readonly address: string
	readonly amount: number
}


// Wallet
export interface Wallet {
	address: string
	balance: number
	privateKey?: string
}

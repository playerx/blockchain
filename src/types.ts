
// Blockchain
export interface Block<T = any> {
	index: number
	hash: string
	previousHash: string
	timestamp: number
	data: T
}



// Messages
export enum MessageType {
	REQUEST_LATEST = 'QUERY_LATEST',
	REQUET_CHAIN = 'QUERY_ALL',
	RECEIVE_BLOCK = 'ADD_BLOCK',
	RECEIVE_CHAIN = 'RESPONSE_BLOCKCHAIN',
}

export interface QueryLatestMessage {
	type: MessageType.REQUEST_LATEST
}

export interface QueryAllMessage {
	type: MessageType.REQUET_CHAIN
}

export interface AddBlockMessage {
	type: MessageType.RECEIVE_BLOCK
	block: Block
}

export interface ResponseBlockchainMessage {
	type: MessageType.RECEIVE_CHAIN
	blocks: Block[]
}

export type Message =
	QueryLatestMessage |
	QueryAllMessage |
	AddBlockMessage |
	ResponseBlockchainMessage

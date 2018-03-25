
// Blockchain
export interface Block<T = any> {
	index: number
	hash: string
	previousHash: string
	timestamp: number
	data: T
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
	REQUET_CHAIN = 'QUERY_ALL',
	RECEIVED_LATEST_BLOCK = 'RECEIVED_LATEST_BLOCK',
	RECEIVED_CHAIN = 'RECEIVED_BLOCKCHAIN',
}

export interface QueryLatestMessage {
	type: MessageType.REQUEST_LATEST
}

export interface QueryAllMessage {
	type: MessageType.REQUET_CHAIN
}

export interface AddBlockMessage {
	type: MessageType.RECEIVED_LATEST_BLOCK
	block: Block
}

export interface ResponseBlockchainMessage {
	type: MessageType.RECEIVED_CHAIN
	blocks: Block[]
}

export interface MessageBase {
	receiveTime?: number
}

export type Message = MessageBase &
	(
		QueryLatestMessage |
		QueryAllMessage |
		AddBlockMessage |
		ResponseBlockchainMessage
	)

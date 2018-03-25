import { uniqueId } from 'jokio'
import * as WebSocket from 'ws'
import { Message, MessageType, Block } from 'types'
import { getLatestBlock, getBlockchain, addBlockToChain, AddBlockResult, replaceChain } from 'blockchain'

type NamedWebSocket = WebSocket & {
	id?: string,
	name?: string,
	connectTime?: number
	messages?: Message[]
}


// public functions
export const initP2PServer = (host: string, port: number) => {
	serverEndpoint = `://${host}:${port}`

	const server: WebSocket.Server = new WebSocket.Server({ host, port })
	server.on('connection', (ws: NamedWebSocket) => initConnection(ws, false))
	console.log('listening websocket p2p port on: ' + port)
}

export const connectToPeer = (endpoint) => new Promise((resolve, reject) => {
	if (~endpoint.indexOf(serverEndpoint))
		throw new Error('CANT_CONNECT_MYSELF')

	const ws: NamedWebSocket = new WebSocket(endpoint);
	ws.id = uniqueId()

	ws.on('open', () => initConnection(ws, true) || resolve(webSocketToPeer(ws)))
	ws.on('error', () => reject('CONNECTION_FAILED'))
})

export const getPeers = (onlyConnected = false) => sockets
	.filter(x => !onlyConnected || isSocketConnected(x))
	.map(webSocketToPeer)

export const broadcastLatestBlock = () => broadcast({
	type: MessageType.RECEIVED_LATEST_BLOCK,
	block: getLatestBlock()
})


// internal state
let serverEndpoint;
const sockets: NamedWebSocket[] = []


// internal functions
const initConnection = (ws: NamedWebSocket, isInitiator: boolean) => {

	ws.id = ws.id || uniqueId()
	ws.name = isInitiator ? `PRIMARY ${ws.url}` : `SECONDARY ${Date.now()}`
	ws.connectTime = Date.now()
	ws.messages = []

	sockets.push(ws)

	ws.on('message', (data: string) => handleMessage(ws, tryParse(data)))
	ws.on('close', () => closeConnection(ws))
	ws.on('error', () => closeConnection(ws))

	send(ws)({ type: MessageType.REQUEST_LATEST })
}

const closeConnection = (ws: WebSocket) => {
	console.log('connection failed to peer: ' + ws.url);
	sockets.splice(sockets.indexOf(ws), 1);
}

const handleMessage = (ws: NamedWebSocket, msg: Message) => {

	msg.receiveTime = Date.now()
	ws.messages.unshift(msg) // for debug

	switch (msg.type) {
		case MessageType.REQUEST_LATEST:
			send(ws)({
				type: MessageType.RECEIVED_LATEST_BLOCK,
				block: getLatestBlock()
			})
			break

		case MessageType.RECEIVED_LATEST_BLOCK:
			handleAddBlock(msg.block);
			break

		case MessageType.REQUET_CHAIN:
			send(ws)({
				type: MessageType.RECEIVED_CHAIN,
				blocks: getBlockchain()
			})
			break

		case MessageType.RECEIVED_CHAIN:
			handleReplaceChain(msg.blocks);
			break
	}
}

const handleAddBlock = (block: Block) => {
	const result = addBlockToChain(block)

	switch (result) {
		case AddBlockResult.InvalidBlock:
			console.log('block structuture not valid')
			break

		case AddBlockResult.InvalidIndex:
			console.log('block index not valid')
			break

		case AddBlockResult.InvalidPreviousHash:
			console.log('We have to query the chain from our peer')
			broadcast({ type: MessageType.REQUET_CHAIN })
			break

		case AddBlockResult.Success:
			broadcast({ type: MessageType.RECEIVED_LATEST_BLOCK, block });
			break
	}
}

const handleReplaceChain = (receivedBlocks: Block[]) => {
	if (!replaceChain(receivedBlocks)) {
		console.log('received blockchain is not valid');
		return
	}

	broadcast({ type: MessageType.RECEIVED_LATEST_BLOCK, block: getLatestBlock() })
}

const isSocketConnected = (socket: WebSocket) => (socket.readyState === WebSocket.OPEN)


const broadcast = (message: Message) => sockets.forEach(ws => send(ws)(message))
const send = (ws: WebSocket) => (message: Message) => ws.send(JSON.stringify(message))


// helper
const webSocketToPeer = x => ({
	id: x.id,
	name: x.name,
	connectTime: x.connectTime,
	isConnected: isSocketConnected(x),
	messages: x.messages,
	// commands: x.messages.map(messageToCommand),
})

// const messageToCommand = x => ({
// 	receiveTime: x.receiveTime,
// 	message: x
// })

const tryParse = (x: string) => {
	try {
		return JSON.parse(x);
	} catch (e) {
		return {};
	}
}

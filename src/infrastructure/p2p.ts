import { uniqueId } from 'jokio'
import * as WebSocket from 'ws'
import { Message, MessageType, Block, Transaction } from '../domain/types'
import * as blockchain from '../domain/blockchain'
import * as tranPool from '../domain/transaction-pool'

type NamedWebSocket = WebSocket & {
	id?: string,
	name?: string,
	connectTime?: number
	messages?: Message[],
}


// public functions
export const initP2PServer = (host: string, port: number) => {
	serverEndpoint = `://${host}:${port}`

	const wss: WebSocket.Server = new WebSocket.Server({ host, port })
	wss.on('connection', (ws: NamedWebSocket) => initConnection(ws, false))
	console.log('listening websocket p2p port on: ' + port)
}

export const initP2PServerWithHttpServer = (server) => {
	// serverEndpoint = `://${host}:${port}`

	const wss: WebSocket.Server = new WebSocket.Server({ server, path: '/blockchain' })
	wss.on('connection', (ws: NamedWebSocket) => initConnection(ws, false))
	// console.log('listening websocket p2p port on: ' + port)
}

export const connectToPeer = (endpoint) => new Promise((resolve, reject) => {
	if (~endpoint.indexOf(serverEndpoint))
		throw new Error('CANT_CONNECT_MYSELF')

	const ws: NamedWebSocket = new WebSocket(endpoint);
	ws.id = uniqueId()

	ws.on('open', () => initConnection(ws, true) || resolve(webSocketToPeer(ws)))
	ws.on('error', () => reject('CONNECTION_FAILED'))
})

export const getPeers = (onlyConnected = false) => {
	return sockets
		.filter(x => !onlyConnected || isSocketConnected(x))
		.map(webSocketToPeer)
}

export const broadcastLatestBlock = () => broadcast({
	type: MessageType.RECEIVED_LATEST_BLOCK,
	block: blockchain.getLatestBlock(),
})

export const broadcastTransactionPool = () => broadcast({
	type: MessageType.RECEIVED_TRANPOOL,
	transactions: tranPool.getTransactionPool(),
})


// internal state
let serverEndpoint;
const sockets: NamedWebSocket[] = []


// internal functions
const initConnection = (ws: NamedWebSocket, isInitiator: boolean) => {

	console.log('connected something')

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
				block: blockchain.getLatestBlock(),
			})
			break

		case MessageType.RECEIVED_LATEST_BLOCK:
			handleAddBlock(msg.block)
			break

		case MessageType.REQUEST_CHAIN:
			send(ws)({
				type: MessageType.RECEIVED_CHAIN,
				blocks: blockchain.getBlockchain(),
			})
			break

		case MessageType.RECEIVED_CHAIN:
			handleReplaceChain(msg.blocks)
			break

		case MessageType.REQUEST_TRANPOOL:
			send(ws)({
				type: MessageType.RECEIVED_TRANPOOL,
				transactions: tranPool.getTransactionPool(),
			})
			break

		case MessageType.RECEIVED_TRANPOOL:
			handleReceivedTranPool(msg.transactions)
			break

		default:
			break
	}
}

const handleAddBlock = (block: Block) => {
	if (!blockchain.isValidBlockStructure(block)) {
		return
	}

	const latestBlock = blockchain.getLatestBlock()
	if (block.index <= latestBlock.index) {
		return
	}

	if (latestBlock.hash !== block.previousHash) {
		broadcast({ type: MessageType.REQUEST_CHAIN })
		return
	}

	if (!blockchain.addBlockToChain(block)) {
		return
	}

	broadcast({ type: MessageType.RECEIVED_LATEST_BLOCK, block })
}

const handleReplaceChain = (receivedBlocks: Block[]) => {
	console.log('handleReplaceChain')
	if (!blockchain.replaceChain(receivedBlocks)) {
		console.log('handleReplaceChain canceled')
		return
	}

	broadcast({ type: MessageType.RECEIVED_LATEST_BLOCK, block: blockchain.getLatestBlock() })
}

const handleReceivedTranPool = (receivedTransactions: Transaction[]) => {
	if (receivedTransactions === null) {
		console.log('invalid transaction received')
		return
	}

	let isAddedSuccessfully = false

	receivedTransactions.forEach((tx: Transaction) => {
		try {
			tranPool.addToTransactionPool(tx)
			isAddedSuccessfully = true
		} catch (e) {
			console.log(e.message)
		}
	})

	if (isAddedSuccessfully) {
		broadcast({
			type: MessageType.RECEIVED_TRANPOOL,
			transactions: tranPool.getTransactionPool(),
		})
	}
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

const tryParse = (x: string) => {
	try {
		return JSON.parse(x);
	} catch (e) {
		return {};
	}
}

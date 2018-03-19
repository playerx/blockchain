import * as WebSocket from 'ws'
import { Message, MessageType, Block } from 'types'
import { getLatestBlock, getBlockchain, addBlockToChain, AddBlockResult, replaceChain } from 'blockchain'


// public functions
export const initP2PServer = (port: number) => {
	const server: Server = new WebSocket.Server({ port })
	server.on('connection', (ws: WebSocket) => initConnection(ws))
	console.log('listening websocket p2p port on: ' + port)
}

export const connectToPeer = (url: string) => new Promise((resolve, reject) => {
	const ws: WebSocket = new WebSocket(url);
	ws.on('open', () => {
		initConnection(ws)
		resolve({
			endpoint: ws.url,
			isConnected: isSocketConnected(ws),
		})
	})
	ws.on('error', () => reject('CONNECTION_FAILED'))
})

export const getPeers = (onlyConnected = false) => {
	return sockets
		.filter(x => !onlyConnected || isSocketConnected(x))
		.map(x => ({
			endpoint: x.url,
			isConnected: isSocketConnected(x)
		}))
}


// internal state
const sockets: WebSocket[] = []


// internal functions
const initConnection = (ws: WebSocket) => {

	sockets.push(ws);

	ws.on('message', (data: Message) => handleMessage(ws, data))
	ws.on('close', () => closeConnection(ws));
	ws.on('error', () => closeConnection(ws));

	send(ws)({ type: MessageType.REQUEST_LATEST })
}

const closeConnection = (ws: WebSocket) => {
	console.log('connection failed to peer: ' + ws.url);
	sockets.splice(sockets.indexOf(ws), 1);
}

const handleMessage = (ws: WebSocket, msg: Message) => {
	switch (msg.type) {
		case MessageType.REQUEST_LATEST:
			send(ws)({
				type: MessageType.RECEIVE_BLOCK,
				block: getLatestBlock()
			})
			break

		case MessageType.RECEIVE_BLOCK:
			handleAddBlock(msg.block);
			break

		case MessageType.REQUET_CHAIN:
			send(ws)({
				type: MessageType.RECEIVE_CHAIN,
				blocks: getBlockchain()
			})
			break

		case MessageType.RECEIVE_CHAIN:
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
			broadcast({ type: MessageType.RECEIVE_BLOCK, block });
			break
	}
}

const handleReplaceChain = (receivedBlocks: Block[]) => {
	if (!replaceChain(receivedBlocks)) {
		console.log('received blockchain is not valid');
		return
	}

	broadcast({ type: MessageType.RECEIVE_BLOCK, block: getLatestBlock() })
}

const isSocketConnected = (socket: WebSocket) => (socket.readyState === WebSocket.OPEN)


const broadcast = (message: Message) => sockets.forEach(ws => send(ws)(message))
const send = (ws: WebSocket) => (message: Message) => ws.send(JSON.stringify(message))

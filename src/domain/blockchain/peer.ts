import { Peer, Block } from "../../model"

export const addPeer = (peer: Peer) => (state: Peer[]) => {
	validatePeer(peer)
	validateState(state)

	const alreadyExists = state.filter(x => x.endpoint === peer.endpoint)[0]
	return alreadyExists
		? [...state]
		: [...state, peer]
}

export const isPeerConnected = (peer: Peer) => {
	validatePeer(peer)

	return (peer.ws.status === 1)
}


const validatePeer = (peer: Peer) => {
	if (!peer ||
		!peer.endpoint ||
		!peer.client ||
		!peer.ws ||
		(typeof peer.endpoint !== 'string')
	) {
		throw new Error('INVALID_PEER')
	}
}

const validateState = (state: Peer[]) => {
	if (!state ||
		!Array.isArray(state)
	) {
		throw new Error('INVALID_STATE')
	}
}

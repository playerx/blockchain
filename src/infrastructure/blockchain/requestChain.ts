import { Peer, Block } from 'model'
import gql from 'graphql-tag'


export const requestChain = (peer: Peer) => {
	const query = gql`

	`

	peer.client.query({ query })
	// peers.forEach(x => x.client.mutate({
	// 	mutation
	// }))
}

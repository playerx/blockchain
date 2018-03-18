import { WebSocketLink } from 'apollo-link-ws'
import ApolloClient from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { getPlatform } from '.';


export function connectToPeers({ remoteAddress, port }: ConnectToPeerProps) {

	const endpoint = `ws://${remoteAddress}:${port}/graphql`

	const connectionCallback = (err, result) => {
		console.log('connectionCallback', err, result)
	}

	const link = new WebSocketLink({
		uri: endpoint,
		options: {
			reconnect: true,
			connectionCallback
		},
	})

	const cache = new InMemoryCache()

	const apolloClient = new ApolloClient({ link, cache })
}


export interface ConnectToPeerProps {
	remoteAddress: string
	port: number
}

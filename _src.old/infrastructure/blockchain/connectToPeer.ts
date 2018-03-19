import { SubscriptionClient, ClientOptions } from 'subscriptions-transport-ws';
import { WebSocketLink } from 'apollo-link-ws'
import ApolloClient from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { Peer } from 'model';
import { getPlatform } from '../'

const ws = require('ws')

export function connectToPeers({ endpoint }) {

	return new Promise<Peer>((resolve, reject) => {

		const options: ClientOptions = {
			reconnect: true,
			connectionCallback: (err, result) => err
				? reject(err)
				: resolve({ endpoint, client: apolloClient, ws: client })
		}

		const client = new SubscriptionClient(endpoint, options, ws)
		const link = new WebSocketLink(client)
		const cache = new InMemoryCache()
		const apolloClient = new ApolloClient({ link, cache })
	})
}

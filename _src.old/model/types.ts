import { ApolloClient } from "apollo-client";
import { NormalizedCacheObject } from "apollo-cache-inmemory";
import { SubscriptionClient } from "subscriptions-transport-ws";


export interface Block<T = any> {
	index: number;
	hash: string;
	previousHash: string;
	timestamp: number;
	data: T;
}

export interface Peer {
	endpoint: string
	client: ApolloClient<NormalizedCacheObject>
	ws: SubscriptionClient
}

export interface Database {
	peers: Peer[],
	blocks: Block[],
}

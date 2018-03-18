import { Peer, Block } from "./types";

export const db: Database = {
	peers: [],
	blocks: [],
}

export interface Database {
	peers: Peer[],
	blocks: Block[],
}

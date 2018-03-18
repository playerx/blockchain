
export interface Block<T = any> {
	index: number;
	hash: string;
	previousHash: string;
	timestamp: number;
	data: T;
}

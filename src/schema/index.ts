import * as blockchain from './blockchain';
import * as transaction from './transaction';

const localSchemas = [
	blockchain,
	transaction,
]

export default [
	...localSchemas
]

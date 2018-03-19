import { run } from 'jokio'
import { graphql } from 'jokio-graphql'
import localSchemas from 'schema'
import { generateNextBlock } from 'domain/blockchain';
import db from 'model';


run(
	graphql({
		port: 3000,
		localSchemas
	})
)

setInterval(() => run(
	db.loadBlocks,
	generateNextBlock({ x: 'test block' }),
	db.saveBlocks
), 5000);

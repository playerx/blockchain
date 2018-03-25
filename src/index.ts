import { run } from 'jokio'
import { graphql } from 'jokio-graphql'
import localSchemas from './schema'
import { initP2PServer } from './p2p'
import { load } from 'dotenv'

load()

const graphqlPort = parseInt(process.env.GRAPHQL_PORT, 10) || 3000
const wsPort = parseInt(process.env.WS_PORT, 10) || 4000

run(
	graphql({
		port: graphqlPort,
		localSchemas
	})
)

initP2PServer('localhost', wsPort)

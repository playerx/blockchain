import { run } from 'jokio'
import { graphql, Context } from 'jokio-graphql'
import { config } from 'dotenv'
import localSchemas from './schema'
import { initP2PServerWithServer } from './infrastructure/p2p'
// import * as http from 'http'
import * as express from 'express'

config()

const { PORT } = process.env
const port = parseInt(PORT, 10) || 3000

const app = express()
const p2p = (state, context: Context) => initP2PServerWithServer(context.server) || state
const log = (state, context: Context) => console.log('Listening', context.server.address()) || state

const graphqlProps = {
	port,
	localSchemas,
	express: app,
	endpoint: '/',
	subscriptions: null
}

run(
	graphql(graphqlProps),
	p2p,
	log
)

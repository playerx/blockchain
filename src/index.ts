import { run } from 'jokio'
import { graphql, Context } from 'jokio-graphql'
import { config } from 'dotenv'
import { localSchemas } from './schema'
import * as application from './application'
import * as p2p from './infrastructure/p2p'
import * as expressServer from 'express'

config()

const { PORT, PRIVATE_KEY: privateKey } = process.env
const port = parseInt(PORT, 10) || 3000

const express = expressServer()
const p2pServer = (state, context: Context) => p2p.initP2PServerWithServer(context.server) || state
const log = (state, context: Context) => console.log('Listening', context.server.address()) || state

const graphqlProps = {
	port,
	localSchemas,
	express,
	endpoint: '/',
	subscriptions: null
}

run(
	graphql(graphqlProps),
	p2pServer,
	log
)

application.start(privateKey)

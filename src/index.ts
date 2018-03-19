import { run } from 'jokio'
import { graphql } from 'jokio-graphql'
import localSchemas from 'schema'
import { initP2PServer } from 'p2p'

run(
	graphql({
		port: 3000,
		localSchemas
	})
)

initP2PServer('localhost', 4000)

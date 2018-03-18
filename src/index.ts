import { run } from 'jokio'
import { graphql } from 'jokio-graphql'

import localSchemas from './schema'


run(
	graphql({
		port: 3000,
		localSchemas
	})
)

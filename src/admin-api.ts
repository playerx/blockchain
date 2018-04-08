import * as readline from 'readline'
import * as app from './application'

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

rl.on('line', (input) => {
	try {
		const cmd = getNextPart(input, x => input = x)

		switch (cmd) {
			case 'mine':
				{
					const comment = getNextPart(input, x => input = x)
					const description = input

					app.mineNextBlock(null, comment, description)

					console.log('✅ - Completed successfully!')
				}
				break

			case 'send':
				{
					const toAddress = getNextPart(input, x => input = x)
					const amount = parseInt(getNextPart(input, x => input = x)) || 0
					const description = input

					console.log(toAddress, amount, description)

					if (!toAddress || !amount || !description) {
						console.warn('Invalid Command')
						console.log('Sample: send 04A1231B2312C232...3C342 10 transaction description')
						break
					}

					app.makeTransfer({ toAddress, amount, description })

					console.log('✅ - Completed successfully!')
				}
				break

			default:
				{
					console.log('Available Commands: mine, send')
				}
				break

		}
	}
	catch (err) {
		console.warn(err)
	}
})


const getNextPart = (s: string, cb: (left) => void) => {
	if (!s) {
		cb('')
		return ''
	}

	const index = s.indexOf(' ')
	if (index === -1) {
		cb('')
		return s
	}

	cb(s.substring(index + 1))

	return s.substring(0, index)
}

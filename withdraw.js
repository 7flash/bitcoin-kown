const Transport = require("@ledgerhq/hw-transport-node-hid").default
const AppBtc = require("@ledgerhq/hw-app-btc").default

const rawTransaction = '01000000000101fb9113dbb09cc3b4557aede5b90c85a0a16523cabd776ebf09fa7df783f4da7a0100000000ffffffff02e8a70000000000001600147b9d1d53d56c5f4b366dcb8d65910ff7deb19a2f7e2c0000000000001976a9146a8d5fab5370981806f59ada212f22615c2932e588ac02483045022100a4bc4b5aec3527818cba3dcbd1c67ae2e3537b2c53925eded5e37dae5d30bfe802206a1135fd7ef3404e04d92ae84373e5f981a6b504e6ea64f54bbdfef2feaea1340121026fd1293f943db6ac78486a1ca5ee7b786a5b5aa53c147e6570c5d73e57b1228e00000000'
const recipient = '1AiPz9nWi8o7BUP4b2FT9n7Sf8Er9694G9'

const createTransport = () => {
  return new Promise((resolve, reject) => {
    const subscriber = Transport.listen({
      error: error => reject,
      complete: () => { console.log('transport initialized') },
      next: event => {
        if (event.type === 'add') {
          subscriber.unsubscribe()
          Transport.open(event.descriptor).then(resolve)
        }
      }
    })
  })
}

const main = async () => {
  console.log('Waiting for ledger...')

  const transport = await createTransport()
  const btc = new AppBtc(transport)

  console.log('Parsing transaction outputs...')

  const tx = btc.splitTransaction(rawTransaction)

  console.log(tx.outputs[0].amount.toString('utf8'))
  console.log(tx.outputs[0].script.toString('utf8'))

  return

  const outputScript = btc.serializeTransactionOutputs(tx).toString('hex')

  console.log(`Output script: ${outputScript}`)

  try {
    const result = await btc.createPaymentTransactionNew([[tx, 1]], ["0/5"], undefined, '01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac')
    console.log(`Result: ${result}`)
  } catch (e) {
    console.log(e)
    console.log(e.statusCode)
  }
}
main()
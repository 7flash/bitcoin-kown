const Transport = require("@ledgerhq/hw-transport-node-hid").default
const AppBtc = require("@ledgerhq/hw-app-btc").default

const rawTransaction = '01000000012032b87df2124861a31f94509723feb0a0bb5198c05e728121092a006fc33f44460000006b483045022100f3d74eb373c3e2fc5020396e6d401f34bb19e46c4481785b3e3ff2eebb10ba03022079094e4946c32587778f57ed679153c822fc0d950ebff06c9d86170db8a5ef1d012103f0f0058b236ed5a3c0f343c276391f7aeeef60ff4096821835f75881c0a1e32effffffff0280969800000000001976a91442edaf287ac19f6b803b4c275f173b037363b60c88ace5fdad00000000001976a914bb915be5439b9788d9700675c516920d3bbc9cb788ac00000000'
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

  const tx = btc.splitTransaction(rawTransaction);

  const outputScript = btc.serializeTransactionOutputs(tx).toString('hex')

  console.log(`Output script: ${outputScript}`)

  try {
    const result = await btc.createPaymentTransactionNew([[tx, 1]], ["0/0"], undefined, '01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac')
    console.log(`Result: ${result}`)
  } catch (e) {
    console.log(e)
    console.log(e.statusCode)
  }
}
main()
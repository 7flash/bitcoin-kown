const Transport = require("@ledgerhq/hw-transport-node-hid").default
const AppBtc = require("@ledgerhq/hw-app-btc").default

const rawTransaction = '01000000000101fb9113dbb09cc3b4557aede5b90c85a0a16523cabd776ebf09fa7df783f4da7a0100000000ffffffff02e8a70000000000001600147b9d1d53d56c5f4b366dcb8d65910ff7deb19a2f7e2c0000000000001976a9146a8d5fab5370981806f59ada212f22615c2932e588ac02483045022100a4bc4b5aec3527818cba3dcbd1c67ae2e3537b2c53925eded5e37dae5d30bfe802206a1135fd7ef3404e04d92ae84373e5f981a6b504e6ea64f54bbdfef2feaea1340121026fd1293f943db6ac78486a1ca5ee7b786a5b5aa53c147e6570c5d73e57b1228e00000000'
const recipient = '3FNuPJC5hmALBQGxwheStkUp9zTt4WtzME'

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

  const tx = btc.splitTransaction("01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000");

  const outputScript = btc.serializeTransactionOutputs(tx).toString('hex')

  console.log(`Output script: ${outputScript}`)

  try {
    const result = await btc.createPaymentTransactionNew([[tx, 1]], ["0'/0/0"], undefined, '01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac')
    console.log(`Result: ${result}`)
  } catch (e) {
    console.log(e)
    console.log(e.statusCode)
  }
}
main()

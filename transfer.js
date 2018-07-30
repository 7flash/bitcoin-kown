const bitcore = require('bitcore-lib')
const BufferWriter = bitcore.encoding.BufferWriter
const Output = bitcore.Transaction.Output

const Transport = require("@ledgerhq/hw-transport-node-hid").default
const AppBtc = require("@ledgerhq/hw-app-btc").default

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

const getOutputScript = ({ fundsRecipient, amount }) => {
  const transaction = new bitcore.Transaction()

  transaction.to(fundsRecipient, amount)

  const outputs = transaction.toObject().outputs

  const writer = new BufferWriter()

  writer.writeVarintNum(outputs.length)

  for (let output of outputs) {
    (new Output.fromObject(output)).toBufferWriter(writer)
  }

  return writer.toBuffer().toString('hex')
}

const transfer = async () => {
  const transport = await createTransport()
  const ledger = new AppBtc(transport)

  const hexTransactionWithUTXO = '01000000016fc7339e5ea45435aedd081683383808b381e9afe9bf16e8a0565fb9531a51030100000000ffffffff024906000000000000160014dd1194a2c40fcd8b5d7ad9965ad2eb8f221f7fbc983a0000000000001976a9149b4387bdaa19d26fd7e46d6236fe97b6870489ec88ac00000000'

  const parsedTransaction = ledger.splitTransaction(hexTransactionWithUTXO)

  const utxo = [parsedTransaction, 1]

  const outputScript = getOutputScript({ fundsRecipient: '1KT5focu1NhWxEcnfDvTxZw5Mv9Cb8uCgr', amount: 14000 })

  console.log(parsedTransaction)
  console.log(utxo)
  
  const resultTransaction = await ledger.createPaymentTransactionNew(utxo, `44'/0'/0'/0/0`, undefined, outputScript)

  console.log(resultTransaction)
}
transfer()
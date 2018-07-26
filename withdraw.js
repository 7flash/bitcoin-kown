const bitcoin = require("./bitcoin")
const r2 = require("r2")

const bitcore = require('bitcore-lib')
const BufferWriter = bitcore.encoding.BufferWriter
const Output = bitcore.Transaction.Output

const Transport = require("@ledgerhq/hw-transport-node-hid").default
const AppBtc = require("@ledgerhq/hw-app-btc").default

const fundsRecipient = '3FNuPJC5hmALBQGxwheStkUp9zTt4WtzME'
const xpubkey = 'xpub6DAd9Quenw1y3QTX8NLKgEKFaNdYWWXcG9L2U9FMmkiHip1nbwPhSKTQVdGe1fFg5giQA2z6BoUCMgiciowHxYuu7JNjFBGhfPUMN7VUqM9'

const checkTransactions = (transactions, address) => {
  const emptyFlag = isEmpty(transactions)
  const validFlag = isValid(transactions, address)

  if (emptyFlag) {
    console.log(`${address} is empty`)
  } else {
    console.log(`${address} has transactions`)

    if (!validFlag) {
      console.log(`${address} has unexpected transactions`)
    }
  }

  return !emptyFlag && validFlag
}

const isValid = (transactions, address) => {
  if (typeof transactions !== 'object') return
  if (transactions.length !== 1) return
  if (transactions[0].vout.length !== 2) return
  if (typeof transactions[0].vout[1].scriptPubKey !== 'object') return
  if (typeof transactions[0].vout[1].scriptPubKey.addresses !== 'object') return
  if (transactions[0].vout[1].scriptPubKey.addresses[0] !== address) return

  return true
}

const isEmpty = (transactions) => {
  return (typeof transactions === 'object' && transactions.length === 0) ? true : false
}

const getTransactions = async (address) => {
  const transactions = await r2(`https://insight.bitpay.com/api/txs?address=${address}`).json

  return transactions.txs
}

const getRawTransaction = async (txid) => {
  const rawTransaction = await r2(`https://blockchain.info/tx/${txid}?format=hex`).text

  return rawTransaction
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

const withdraw = async ({ ledger, xpubkey, startAccount, endAccount, fundsRecipient }) => {
  let inputs = []
  let keys = []
  let outputScript = ''
  let amount = 0

  for (let index = startAccount; index < endAccount; index++) {
    const address = bitcoin.createAccount(xpubkey, index).address

    const transactions = await getTransactions(address)

    const checked = checkTransactions(transactions, address)

    if (checked) {
      const txid = transactions[0].txid

      const rawTransaction = await getRawTransaction(txid)

      const transaction = ledger.splitTransaction(rawTransaction)

      console.log(JSON.stringify(transaction))

      inputs.push([transaction, 0])
      keys.push(`0/${index}`)
      amount += transactions[0].vout[1].value
    }
  }

  amount = amount * 10**8

  console.log(`Amount: ${amount.toString()}`)
  console.log(`Keys: ${keys.toString()}`)
  console.log(`Inputs: ${inputs.length}`)

  outputScript = getOutputScript({ fundsRecipient, amount })

  console.log(`Output script: ${outputScript.toString()}`)

  const withdrawTransaction = await ledger.createPaymentTransactionNew(inputs, keys, undefined, outputScript)

  console.log(`Withdraw transaction is ready for broadcasting`)

  console.log('------------------------------------------------')
  console.log(withdrawTransaction)
  console.log('------------------------------------------------')
}

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
  const ledger = new AppBtc(transport)

  await withdraw({
    ledger,
    xpubkey,
    fundsRecipient,
    startAccount: 5,
    endAccount: 6
  })
}
main()

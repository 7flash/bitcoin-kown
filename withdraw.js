const bitcoin = require("./bitcoin")

const r2 = require("r2")
const argv = require('yargs').argv

const bitcore = require('bitcore-lib')
const BufferWriter = bitcore.encoding.BufferWriter
const Output = bitcore.Transaction.Output

const Transport = require("@ledgerhq/hw-transport-node-hid").default
const AppBtc = require("@ledgerhq/hw-app-btc").default

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
  if (typeof transactions !== 'object' || transactions.length !== 1 || transactions[0].vout.length !== 2)
    return false

  if (!(getAddressFromOutput(transactions[0].vout[0]) === address ||
      getAddressFromOutput(transactions[0].vout[1]) === address))
    return false

  return true
}

const isEmpty = (transactions) => {
  return (typeof transactions === 'object' && transactions.length === 0) ? true : false
}

const getAddressFromOutput = (output) => {
  if (!output || !output.scriptPubKey || !output.scriptPubKey.addresses)
    return false

  if (typeof output.scriptPubKey.addresses[0] !== 'string')
    return false

  return output.scriptPubKey.addresses[0]
}

const getOutputIndex = ({ tx, address }) => {
  if (getAddressFromOutput(tx.vout[0]) === address)
    return 0;
  if (getAddressFromOutput(tx.vout[1]) === address)
    return 1;

  return null;
}

const getTransactions = async (address) => {
  const transactions = await r2(`https://insight.bitpay.com/api/txs?address=${address}`).json

  return transactions.txs
}

const getRawTransaction = async (txid) => {
  const rawTransaction = await r2(`https://insight.bitpay.com/api/rawtx/${txid}`).json

  return rawTransaction.rawtx
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
      const tx = transactions[0]

      const txid = tx.txid

      const rawTransaction = await getRawTransaction(txid)

      const transaction = ledger.splitTransaction(rawTransaction)

      let outputIndex = getOutputIndex({ tx, address })

      inputs.push([transaction, outputIndex])
      keys.push(`0/${index}`)
      amount += transactions[0].vout[outputIndex].value
    }
  }

  const fee = (keys.length * 180 + keys.length + 44) * 20

  amount = amount * 10**8
  amount -= fee

  console.log(`Amount: ${amount.toString()}`)
  console.log(`Keys: ${keys.toString()}`)
  console.log(`Inputs: ${inputs.length}`)

  if (amount < 0) {
    console.log(`Balance not enough`)
    return;
  }

  outputScript = getOutputScript({ fundsRecipient, amount })

  console.log(`Output script: ${outputScript.toString()}`)

  console.log(`Signing transaction...`)

  try {
    const withdrawTransaction = await ledger.createPaymentTransactionNew(inputs, keys, undefined, outputScript)

    console.log(`Withdraw transaction is ready for broadcasting`)

    console.log('------------------------------------------------')
    console.log(withdrawTransaction)
    console.log('------------------------------------------------')
  } catch (e) {
    console.log(e)
  }
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
  if (typeof argv.recipient !== 'string' || typeof argv.start !== 'number' || typeof argv.end !== 'number')
    return console.log('node withdraw.js --recipient=XX --start=5 --end=6')

  console.log('Waiting for ledger...')

  const transport = await createTransport()
  const ledger = new AppBtc(transport)

  await withdraw({
    ledger,
    xpubkey,
    fundsRecipient: argv.recipient,
    startAccount: argv.start,
    endAccount: argv.end
  })
}
main()
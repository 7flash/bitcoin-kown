const bitcoin = require('./bitcoin')
const fs = require('fs')
const db = require('lowdb')(new (require('lowdb/adapters/FileSync'))('db.json'))

const key = 'xpub6DAd9Quenw1y3QTX8NLKgEKFaNdYWWXcG9L2U9FMmkiHip1nbwPhSKTQVdGe1fFg5giQA2z6BoUCMgiciowHxYuu7JNjFBGhfPUMN7VUqM9'
const limit = 1000

const checkBalance = async (account) => {
  const payments = await bitcoin.checkoutAddress(account)

  const balance = payments.length > 0 ? payments[0].tx.valueIn : 0

  return balance
}

const saveAccount = ({ index, address, balance }) => {
  db.get('accounts').push({ index, address, balance }).write()
  console.log(address, index, balance)
}

const sleep = async (seconds) => {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

const saveAccounts = async (key, from, to) => {
  try {
    for (let index = from; index < to; index++) {
      const address = bitcoin.createAccount(key, index).address

      const balance = await checkBalance(address)

      if (balance > 0) {
        saveAccount({index, address, balance})
      } else {
        console.log(`${address} (${index}) is empty`)
      }

      await sleep(8.2)
    }
  } catch (e) {
    console.log(e.message)
  }
}

saveAccounts(key, 5, limit)
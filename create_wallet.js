const bitcoin = require('./index.js');

const wallet = bitcoin.generateWallet();

console.log("Private Key: " + wallet.privateKey);
console.log("Public Key: " + wallet.publicKey);
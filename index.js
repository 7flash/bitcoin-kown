const bitcore = require('bitcore-lib');
const HDPrivateKey = bitcore.HDPrivateKey;
const HDPublicKey = bitcore.HDPublicKey;
const Address = bitcore.Address;

module.exports = {
	generateWallet() {
		const hdPrivateKey = new HDPrivateKey();
		const hdPublicKey = hdPrivateKey.hdPublicKey;

		return {
			privateKey: hdPrivateKey.xprivkey,
			publicKey: hdPublicKey.xpubkey
		}
	},

	createAccount(pubkey, index) {
		const hdPublicKey = new HDPublicKey(pubkey);

		const node = hdPublicKey.derive(index).derive(0);

		const address = Address(node.publicKey).toString();

		return {
			index: index,
			node: node,
			address: address
		}
	},

	createAccountPrivate(privkey, index) {
		const hdPrivateKey = new HDPrivateKey(privkey);

		const node = hdPrivateKey.derive(index).derive(0);

		const address = Address(node.publicKey).toString();

		return {
			index: index,
			node: node,
			address: address
		};
	},

	getBalance(pubkey, maxIndex) {
	},

	getAllAccountTransactions(pubkey, index) {
	},

	getNotProcessedAccountTransactions(pubkey, index) {
	},

	linkInvestor(mnemonic, apiKey, bitcoinAddress, ethereumAddress) {
	},

	relayTransaction(mnemonic, apiKey, hash) {
	}
}

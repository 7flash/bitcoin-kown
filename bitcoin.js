const bitcore = require('bitcore-lib');
const HDPrivateKey = bitcore.HDPrivateKey;
const HDPublicKey = bitcore.HDPublicKey;
const Address = bitcore.Address;

const rp = require('request-promise');

const generateWallet = () => {
	const hdPrivateKey = new HDPrivateKey();
	const hdPublicKey = hdPrivateKey.hdPublicKey;

	return {
		privateKey: hdPrivateKey.xprivkey,
		publicKey: hdPublicKey.xpubkey
	}
}

const createAccount = (pubkey, index) => {
	const hdPublicKey = new HDPublicKey(pubkey);

	const node = hdPublicKey.derive(index).derive(0);

	const address = Address(node.publicKey).toString();

	return {
		index,
		node,
		address
	}
}

const createAccountPrivate = (xprivkey, index) => {
	const hdPrivateKey = new HDPrivateKey(xprivkey);

	const node = hdPrivateKey.derive(index).derive(0);

	const address = Address(node.publicKey).toString();

	return {
		index,
		node,
		address
	}
}

const checkoutWallet = (xpubkey, maxIndex) => {
	let payments = [];

	for(let i = 0; i < maxIndex; i++) {
		const address = createAccount(xpubkey, i).address;

		const paymentsForAccount = module.exports.checkoutAddress(address);

		payments.push(paymentsForAccount);
	}

	return Promise.all(payments).then(paymentsAll => {
		return [].concat(...paymentsAll);
	})
}

const createWalletWatcher = ({
  extendedPublicKey,
  numberOfInvestors,
  processorCallback,
  reportCallback,
  timeoutInterval
}) => {
	return {
		xpubkey: extendedPublicKey,
		nInvestors: numberOfInvestors,
		watchInterval: timeoutInterval,
		processPayment: processorCallback,
		sendReport: reportCallback,

		watchTimeoutFn: null,

		watch() {
			checkoutWallet(this.xpubkey, this.nInvestors).then(payments => {
				const processors = [];

				for(let i = 0; i < payments.length; i++) {
					const processor = this.processPayment(payments[i]);
					processors.push(processor);
				}

				Promise.all(processors).then(report => {
					this.watchTimeoutFn = setTimeout(() => {
						this.watch();
					}, this.watchInterval);

					this.sendReport(report);
				});
			});

			return {
				extendedPublicKey: this.xpubkey,
				numberOfInvestors: this.nInvestors,
				timeoutInterval: this.watchInterval
			};
		},

		stop() {
			return clearTimeout(this.watchTimeoutFn);
		},

		updateInvestorsNumber(value) {
			this.nInvestors = value;
		},

		updateTimeoutInterval(value) {
			this.watchInterval = value;
		}
	}
}

const checkoutAddress = address => {
	const url = 'https://insight.bitpay.com/api/txs?address=' + address;

	return rp(url).then(result => {
		let transactions = [];
		let payments = [];

		try {
			transactions = JSON.parse(result).txs;
		} catch(e) {}

		transactions.forEach(tx => {
			tx.vout.forEach(txout => {
				if(txout.scriptPubKey && txout.scriptPubKey.addresses && txout.scriptPubKey.addresses[0] === address) {
					payments.push({
						address: address,
						txid: tx.txid,
						tx
					});
				}
			})
		});

		return payments;
	});
}

module.exports = {
	generateWallet,
	createAccount,
	createAccountPrivate,

	createWalletWatcher,
	checkoutWallet,
	checkoutAddress
}
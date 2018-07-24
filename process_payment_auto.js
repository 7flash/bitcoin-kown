const ethereum = require('./ethereum');

const isValid = wallet => typeof wallet === 'string' && wallet.length > 0;

const relayTransaction = txHash => {
	return ethereum.relayTransaction(txHash);
}

const fetchInvestorWallet = address => {
	return Promise.resolve(address);
}

const updateInvestorWallet = address => {
	return ethereum.getInvestorWallet(address).then(wallet => {
		if(isValid(wallet)) {
			console.log(`Wallet for ${address} is already settled`);
			return true;
		} else {
			return fetchInvestorWallet(address).then(wallet => {
				if(isValid(wallet)) {
					return ethereum.setInvestorWallet(address, wallet).then(() => {
						console.log(`Updated wallet for ${address}: ${wallet}`);
						return true;
					}).fail(() => {
						console.error(`Cannot set wallet for ${address}`);
						return false;
					})
				} else {
					console.log(`${address} should set wallet before payment processing`);
					return false;
				}
			})
		}
	})
}

const processPayment = (address, txHash) => {
	return updateInvestorWallet(address).then(() => {
		return ethereum.checkTransaction(txHash);
	}).then(isProcessed => {
		if(isProcessed === true) return true;
		else {
			return relayTransaction(txHash);
		}
	})
}

module.exports = processPayment;
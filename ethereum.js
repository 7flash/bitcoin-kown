const Web3 = require('web3');

const proxyContractAddress = 0x123;
const btcRelay = btcRelayAbi.at(0x123);

const relayTransaction = (rawTransaction, transactionIndex, merkleSiblings, blockHash) => {
	return btcRelay.relayTransaction(rawTransaction, transactionIndex, merkleSiblings, blockHash, contractAddress);
}

const setInvestorWallet = (address, wallet) => {
	return btcProxy.setWalletForInvestor(address, wallet);
}

const getInvestorWallet = address => {
	return btcProxy.wallets(address).call();
}

const checkTransaction = txHash => {
	return btcProxy.processedTransactions(txHash).call(); // hack the private
}

module.exports = {
	setInvestorWallet,
	getInvestorWallet,
	relayTransaction,
	checkTransaction,
	proxyContractAddress
}
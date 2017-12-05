const processPayment = ({address, txid}) => {
	console.log(`Found payment for ${address}: ${txid}`);
	return {
		address: address,
		txid: txid,
		status: 'manual'
	}
}

module.exports = processPayment;
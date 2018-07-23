const bitcoin = require('./bitcoin');
const processPayment = require('./process_payment_manually');

const logReport = report => {
	console.log(`Payments processed!`);
	console.log(report);
}

const watcherSettings = {
	extendedPublicKey: 'xpub6BfKpqjTwvH21wJGWEfxLppb8sU7C6FJge2kWb9315oP4ZVqCXG29cdUtkyu7YQhHyfA5nt63nzcNZHYmqXYHDxYo8mm1Xq1dAC7YtodwUR',
	numberOfInvestors: 7,
	timeoutInterval: 1000*10,
	processorCallback: processPayment,
	reportCallback: logReport
}

const watcher = bitcoin.createWalletWatcher(watcherSettings);

const watcherInfo = watcher.watch();

console.log(`Watching accounts for ${watcherInfo.extendedPublicKey}...`);
console.log(`Next iteration will be processed in ${watcherInfo.timeoutInterval} milliseconds`);
console.log(`Total investors: ${watcherInfo.numberOfInvestors}`);
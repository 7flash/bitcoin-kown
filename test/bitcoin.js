const expect = require('chai').expect;
const sinon = require('sinon');

const bitcoin = require('../bitcoin');

describe("bitcoin bitcoin proxy", function() {
	const wallet = {
		privateKey: 'xprv9s21ZrQH143K2mQWWpn81838R9REeQr67RoMG3g1gBrdDWMktWVhDjYro9vL3GtCJExxPFhvPqP9R8W5VMCntadAy1uymLpeZvHmNP1yWPo',
		publicKey: 'xpub661MyMwAqRbcFFUycrK8NFyryBFj3sZwUeix4S5dEXPc6JguS3owmXsLeSaL16RCAj2zpBhAcGnBYNUrqzZ1p6Yx4X56dMzQHWK2REEbhwu'
	};
	
	it("should generate HD BIP-32 wallet", function() {
		const wallet = bitcoin.generateWallet();

		expect(wallet.privateKey).to.have.length.above(0);
		expect(wallet.publicKey).to.have.length.above(0);

		expect(wallet.publicKey.indexOf('xpub')).to.be.equal(0);
		expect(wallet.privateKey.indexOf('xprv')).to.be.equal(0);
	});

	it("should derive accounts using only extended public key", function() {
		const firstAccount = bitcoin.createAccount(wallet.publicKey, 0);
		const secondAccount = bitcoin.createAccount(wallet.publicKey, 1);

		expect(firstAccount.index).to.be.equal(0);
		expect(firstAccount.address).to.have.length.above(0);
		expect(firstAccount.node.xpubkey).to.have.length.above(0);

		expect(secondAccount.index).to.be.equal(1);
		expect(secondAccount.address).to.be.not.equal(firstAccount.address);
	});

	it("should derive private keys links corresponding to accounts", function() {
		const account = bitcoin.createAccount(wallet.publicKey, 0);
		const accountPrivate = bitcoin.createAccountPrivate(wallet.privateKey, 0);

		expect(account.node.xpubkey).to.be.equal(accountPrivate.node.xpubkey);
		expect(accountPrivate.node.xprivkey).to.have.length.above(0);
	});

	it("should fetch empty list of transactions for new address", function(done) {
		const addressEmpty = bitcoin.createAccount(wallet.publicKey, 0).address;

		bitcoin.checkoutAddress(addressEmpty).then(transactions => {
			expect(transactions.length).to.be.equal(0);
			done();
		});
	});
	
	it("should fetch all input transactions for real address", function(done) {
		const addressLive = '1259ciJvjZCfP6fTgNxNrQY11DLUSVRcVV';

		bitcoin.checkoutAddress(addressLive).then(transactions => {
			expect(transactions.length).to.be.equal(1);
			expect(transactions[0].address).to.be.equal('1259ciJvjZCfP6fTgNxNrQY11DLUSVRcVV');
			expect(transactions[0].txid).to.be.equal('3e1e20028bb65984e839bfc96c63b60b1e369de91b19b0e97e2b9113abdcf12c');
			done();
		});
	});

	it("should fetch empty list of transactions for new HD wallet", function(done) {
		const wallet = bitcoin.generateWallet();

		bitcoin.checkoutWallet(wallet.publicKey, 10).then(payments => {
			expect(payments.length).to.be.equal(0);
			done();
		});
	});

	it("should fetch all input transaction for every HD wallet account", function(done) {
		const wallet = bitcoin.generateWallet();

		sinon.stub(bitcoin, "checkoutAddress").callsFake(() => [1,2]);

		bitcoin.checkoutWallet(wallet.publicKey, 10).then(payments => {
			expect(payments.length).to.be.equal(20);

			bitcoin.checkoutAddress.restore();

			done();
		});
	});

	it("should create watcher instance", function(done) {
		const wallet = bitcoin.generateWallet();

		sinon.stub(bitcoin, "checkoutAddress").callsFake(() => [1,2]);

		const processPaymentStub = sinon.stub().callsFake(() => {
			return true;
		});
		const reportStub = sinon.stub().callsFake(report => {
			expect(processPaymentStub.callCount).to.be.equal(40);

			watcher.stop();

			bitcoin.checkoutAddress.restore();

			done();
		});

		const settings = {
			extendedPublicKey: wallet.publicKey,
			numberOfInvestors: 10,
			processorCallback: processPaymentStub,
			reportCallback: reportStub,
			timeoutInterval: 60*60*1000
		}

		const watcher = bitcoin.createWalletWatcher(settings);

		watcher.updateInvestorsNumber(20);
		watcher.updateTimeoutInterval(watcher.watchInterval * 2);

		const watchInfo = watcher.watch();

		expect(watchInfo.extendedPublicKey).to.be.equal(settings.extendedPublicKey);
		expect(watchInfo.numberOfInvestors).to.be.equal(20);
		expect(watchInfo.timeoutInterval).to.be.equal(120*60*1000);

		expect(watcher).to.be.an.instanceof(Object);
		expect(watcher.watchTimeoutFn).to.be.equal(null);
		expect(watcher.watchInterval).to.be.equal(120*60*1000);
		expect(watcher.nInvestors).to.be.equal(20);
	});
})
const expect = require('chai').expect;
const bitcoin = require('bitcoinjs-lib');
const bip39 = require('bip39');

const kown = require('./index.js');

describe("Kown bitcoin proxy", function() {
	const wallet = {
		privateKey: 'xprv9s21ZrQH143K2mQWWpn81838R9REeQr67RoMG3g1gBrdDWMktWVhDjYro9vL3GtCJExxPFhvPqP9R8W5VMCntadAy1uymLpeZvHmNP1yWPo',
		publicKey: 'xpub661MyMwAqRbcFFUycrK8NFyryBFj3sZwUeix4S5dEXPc6JguS3owmXsLeSaL16RCAj2zpBhAcGnBYNUrqzZ1p6Yx4X56dMzQHWK2REEbhwu'
	};

	it("should generate HD BIP-32 wallet", function() {
		const wallet = kown.generateWallet();

		expect(wallet.privateKey).to.have.length.above(0);
		expect(wallet.publicKey).to.have.length.above(0);

		expect(wallet.publicKey.indexOf('xpub')).to.be.equal(0);
		expect(wallet.privateKey.indexOf('xprv')).to.be.equal(0);
	});

	it("should derive accounts using only extended public key", function() {
		const firstAccount = kown.createAccount(wallet.publicKey, 0);
		const secondAccount = kown.createAccount(wallet.publicKey, 1);

		expect(firstAccount.index).to.be.equal(0);
		expect(firstAccount.address).to.have.length.above(0);
		expect(firstAccount.node.xpubkey).to.have.length.above(0);

		expect(secondAccount.index).to.be.equal(1);
		expect(secondAccount.address).to.be.not.equal(firstAccount.address);
	});

	it("should derive private keys links corresponding to accounts", function() {
		const account = kown.createAccount(wallet.publicKey, 0);
		const accountPrivate = kown.createAccountPrivate(wallet.privateKey, 0);

		expect(account.node.xpubkey).to.be.equal(accountPrivate.node.xpubkey);
		expect(accountPrivate.node.xprivkey).to.have.length.above(0);
	});

	it("should fetch received funds amount", function() {
	});

	it("should fetch transactions for account", function() {

	});

	it("should link investor to unique address using proxy smart contract", function() {
	});

	it("should relay transaction to tokensale using btcrelay proxy", function() {
	});
})
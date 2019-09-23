'use strict';

const MsgBuilder = require('./utils/msgbuilder');
const TxBuilder = require('./utils/txbuilder');
const TxSigner = require('./utils/txsigner');
const Account = require('./utils/account');

const get = require('./helpers/request/get');
const post = require('./helpers/request/post');

const DEFAULT_BECH32_PREFIX = 'darc';
const DEFAULT_DENOM = 'darc';
const DEFAULT_FEE = 5000;
const DEFAULT_GAS = 200000;

class Chain {
    constructor({url, chainId, bech32MainPrefix = DEFAULT_BECH32_PREFIX, path}) {
        this.url = url;
        this.chainId = chainId;
        this.bech32MainPrefix = bech32MainPrefix;
        this.path = path;

        if (!this.url) {
            throw new Error("url object was not set or invalid")
        }
        if (!this.chainId) {
            throw new Error("chainId object was not set or invalid")
        }
        if (!this.bech32MainPrefix) {
            throw new Error("bech32MainPrefix object was not set or invalid")
        }
        if (!this.path) {
            throw new Error("path object was not set or invalid")
        }

        this.msgBuilder = new MsgBuilder().registerMsgTypes();
        this.txBuilder = new TxBuilder();
        this.txSigner = new TxSigner();
    }

    async getAccounts(address) {
        let accountsApi = "/auth/accounts/";
        return await get(`${this.url}${accountsApi}${address}`);
    }

    async getBalance(address) {
        let balanceApi = '/bank/balances/';
        return await get(`${this.url}${balanceApi}${address}`);
    }

    async broadcastTx(signedTx) {
        let broadcastApi = "/txs";
        return await post(`${this.url}${broadcastApi}`, signedTx);
    }

    generateAccount() {
        return new Account(this.path, this.bech32MainPrefix).generate()
    }

    recoverAccount(mnemonic) {
        return new Account(this.path, this.bech32MainPrefix).recover(mnemonic)
    }

    buildMsg(input) {
        let msgType = this.msgBuilder.getMsgType(input.type);
        return msgType.build(input)
    }

    buildTx(msg, txInfo, modeType = "sync") {
        return this.txBuilder.build(msg, txInfo, modeType)
    }

    signWithAccount(tx, account) {
        return this.sign(tx, account.getPrivateKey(), account.getPublicKey())
    }

    sign(tx, privateKey, publicKey) {
        return this.txSigner.sign(tx, privateKey, publicKey);
    }

    async transferFromAccount({
                                  from,
                                  to,
                                  amount,
                                  denom = DEFAULT_DENOM,
                                  fee = DEFAULT_FEE,
                                  feeDenom = DEFAULT_DENOM,
                                  gas = DEFAULT_GAS,
                                  memo = ''
                              }) {
        let msg = this.buildMsg({
            type: "cosmos-sdk/MsgSend",
            from_address: from.getAddress(),
            to_address: to,
            denom,
            amount,
        });
        let tx = this.buildTx(msg, {
            chainId: this.chainId,
            feeDenom,
            fee,
            gas,
            memo,
            accountNumber: from.getAccountNumber(),
            sequence: from.getSequence()
        });
        const signedTx = this.signWithAccount(tx, from);
        return await this.broadcastTx(signedTx);
    }

    async transfer({
                       from,
                       accountNumber,
                       sequence,
                       privateKey,
                       publicKey,
                       to,
                       amount,
                       denom = DEFAULT_DENOM,
                       fee = DEFAULT_FEE,
                       feeDenom = DEFAULT_DENOM,
                       gas = DEFAULT_GAS,
                       memo = ''
                   }) {
        let msg = this.buildMsg({
            type: "cosmos-sdk/MsgSend",
            from_address: from,
            to_address: to,
            denom,
            amount,
        });
        let tx = this.buildTx(msg, {
            chainId: this.chainId,
            feeDenom,
            fee,
            gas,
            memo,
            accountNumber,
            sequence
        });
        const signedTx = this.sign(tx, privateKey, publicKey);
        return await this.broadcastTx(signedTx);
    }
}

function network(config) {
    return new Chain(config);
}

module.exports = {
    network: network
};

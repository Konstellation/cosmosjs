'use strict';

const MsgBuilder = require('./utils/types/MsgBuilder');
const TxBuilder = require('./utils/types/TxBuilder');
const Account = require('./utils/types/Account');

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
    }

    // --------------- api ------------------

    async request({method, uri, path, params, data}) {
        let url = new URL(`${this.url}${uri}${path ? '/' + path : ''}`);
        params && Object.keys(params).forEach(param => {
            url.searchParams.append(param, params[param])
        });
        if (method) {
            return get(url.toString());
        } else {
            return post(url.toString(), data);
        }
    }

    async fetchAccount(address) {
        let accountsApi = "/auth/accounts/";

        return await get(`${this.url}${accountsApi}${address}`);
    }

    async fetchBalance(address) {
        let balanceApi = '/bank/balances/';

        return await get(`${this.url}${balanceApi}${address}`);
    }

    async broadcastTx(signedTx, mode = 'sync') {
        let broadcastApi = "/txs";

        return await post(`${this.url}${broadcastApi}`, {
            tx: signedTx,
            mode
        });
    }

    async fetchTransaction(hash) {
        let txApi = '/txs/';

        return await get(`${this.url}${txApi}${hash}`)
    }

    async fetchOutboundTransactions(address, limit = 30) {
        let txApi = '/txs';

        return await get(`${this.url}${txApi}?message.action=send&message.sender=${address}&limit=${limit}`)
    }

    async fetchInboundTransactions(address, limit = 30) {
        let txApi = '/txs';

        return await get(`${this.url}${txApi}?transfer.recipient=${address}&limit=${limit}`)
    }

    async fetchTotalCoins(denom) {
        let supplyApi = '/supply/total/';

        return await get(`${this.url}${supplyApi}${denom ? denom : ''}`);
    }

    // --------------- api ------------------

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

    buildSignMsg(msg, txInfo) {
        return this.txBuilder.build(msg, txInfo)
    }

    signWithAccount(stdSignMsg, account) {
        return this.sign(stdSignMsg, account.getPrivateKey(), account.getPublicKey())
    }

    sign(stdSignMsg, privateKey, publicKey) {
        return this.txBuilder.sign(stdSignMsg, privateKey, publicKey);
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
        let signMsg = this.buildSignMsg(msg, {
            chainId: this.chainId,
            feeDenom,
            fee,
            gas,
            memo,
            accountNumber: from.getAccountNumber(),
            sequence: from.getSequence()
        });
        const stdTx = this.signWithAccount(signMsg, from);
        return await this.broadcastTx(stdTx);
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
        let tx = this.buildSignMsg(msg, {
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

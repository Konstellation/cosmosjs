'use strict';

const MsgBuilder = require('./utils/types/MsgBuilder');
const TxBuilder = require('./utils/types/TxBuilder');
const Account = require('./utils/types/Account');

const get = require('./helpers/request/get');
const post = require('./helpers/request/post');
const req = require('./helpers/request/req');

const {
    DEFAULT_BECH32_PREFIX,
    DEFAULT_DENOM,
    DEFAULT_FEE,
    DEFAULT_GAS,
    DEFAULT_KEY_PATH
} = require('./utils/constants');

class Chain {
    constructor({url, chainId, bech32MainPrefix = DEFAULT_BECH32_PREFIX, path = DEFAULT_KEY_PATH}) {
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

    /**
     * Perform custom request
     *
     * @param uri
     * @param reqData
     * @returns {Promise<*>}
     */
    async request(uri, reqData) {
        return req(`${this.url}${uri}`, reqData)
    }

    /**
     * Fetch account by address
     *
     * @param address
     * @returns {Promise<*>}
     */
    async fetchAccount(address) {
        const accountsApi = "/auth/accounts/";

        return await get(`${this.url}${accountsApi}${address}`);
    }

    /**
     * Fetch balance of account by address
     *
     * @param address
     * @returns {Promise<*>}
     */
    async fetchBalance(address) {
        const balanceApi = '/bank/balances/';

        return await get(`${this.url}${balanceApi}${address}`);
    }

    /**
     * BroadcastTx broadcasts a transactions either synchronously or asynchronously
     * based on the context parameters.
     * "block"(return after tx commit), "sync"(return afer CheckTx) and "async"(return right away).
     *
     * @param signedTx
     * @param mode sync | async | block
     * @returns {Promise<*>}
     */
    async broadcastTx(signedTx, mode = 'sync') {
        const broadcastApi = "/txs";

        return await post(`${this.url}${broadcastApi}`, {
            data: {
                tx: signedTx,
                mode
            }
        });
    }

    /**
     * Fetch a transaction by hash in a committed block.
     *
     * @param hash
     * @returns {Promise<*>}
     */
    async fetchTransaction(hash) {
        const txApi = '/txs/';

        return await get(`${this.url}${txApi}${hash}`)
    }

    /**
     * Fetch transaction where the address is a sender
     *
     * @param address
     * @param limit
     * @returns {Promise<*>}
     */
    async fetchOutboundTransactions(address, limit = 30) {
        const txApi = '/txs';

        return await get(`${this.url}${txApi}`, {
            query: {
                'message.action': 'send',
                'message.sender': address,
                limit
            }
        });
    }

    /**
     * Fetch transactions where the address is a recipient
     *
     * @param address
     * @param limit
     * @returns {Promise<*>}
     */
    async fetchInboundTransactions(address, limit = 30) {
        const txApi = '/txs';

        return await get(`${this.url}${txApi}`, {
            query: {
                'transfer.recipient': address,
                limit
            }
        });
    }

    /**
     * Search transactions.
     * Genesis transactions are returned if the height parameter is set to zero,
     * otherwise the transactions are searched for by events
     *
     * @param query
     * @returns {Promise<*>}
     */
    async searchTransactions(query) {
        const txApi = '/txs';

        return await get(`${this.url}${txApi}`, {
            query
        })
    }

    /**
     * Fetch the total supply of coins
     *
     * @returns {Promise<*>}
     */
    async fetchTotalSupply() {
        const supplyApi = '/supply/total';

        return await get(`${this.url}${supplyApi}`);
    }

    /**
     * Fetch the supply of a single denom
     *
     * @param       denom       Token denom
     * @returns {Promise<*>}
     */
    async fetchSupplyDenom(denom) {
        const supplyApi = '/supply/total';

        return await get(`${this.url}${supplyApi}${denom ? '/' + denom : ''}`)
    }

    /**
     * Fetch node info
     *
     * @returns {Promise<*>}
     */
    async fetchNodeInfo() {
        const nodeInfoApi = '/node_info';

        return await get(`${this.url}${nodeInfoApi}`)
    }

    // --------------- api ------------------

    generateAccount() {
        return new Account(this.path, this.bech32MainPrefix).generate()
    }

    recoverAccount(mnemonic) {
        return new Account(this.path, this.bech32MainPrefix).recover(mnemonic)
    }

    buildMsg(input) {
        const msgType = this.msgBuilder.getMsgType(input.type);

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
        const msg = this.buildMsg({
            type: "cosmos-sdk/MsgSend",
            from_address: from.getAddress(),
            to_address: to,
            denom,
            amount,
        });
        const signMsg = this.buildSignMsg(msg, {
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
        const msg = this.buildMsg({
            type: "cosmos-sdk/MsgSend",
            from_address: from,
            to_address: to,
            denom,
            amount,
        });
        const tx = this.buildSignMsg(msg, {
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

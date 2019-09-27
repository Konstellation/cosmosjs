import Account from './utils/types/Account';
import TxBuilder from './utils/types/TxBuilder';
import MsgBuilder from './utils/types/MsgBuilder';

import get from './helpers/request/get';
import post from './helpers/request/post';
import req from './helpers/request/req';

import {
    DEFAULT_BECH32_PREFIX,
    DEFAULT_DENOM,
    DEFAULT_FEE,
    DEFAULT_GAS,
    DEFAULT_KEY_PATH,
} from './utils/constants';

class Chain {
    constructor ({
                     apiUrl,
                     nodeUrl,
                     chainId,
                     bech32MainPrefix = DEFAULT_BECH32_PREFIX,
                     path = DEFAULT_KEY_PATH,
                 }) {
        this.apiUrl = apiUrl;
        this.nodeUrl = nodeUrl;
        this.chainId = chainId;
        this.bech32MainPrefix = bech32MainPrefix;
        this.path = path;

        if (!this.apiUrl) {
            throw new Error('apiUrl object was not set or invalid');
        }
        if (!this.nodeUrl) {
            throw new Error('nodeUrl object was not set or invalid');
        }
        if (!this.bech32MainPrefix) {
            throw new Error('bech32MainPrefix object was not set or invalid');
        }
        if (!this.path) {
            throw new Error('path object was not set or invalid');
        }

        this.msgBuilder = new MsgBuilder().registerMsgTypes();
        this.txBuilder = new TxBuilder();
    }

    updateConfig ({node_info}) {
        this.chainId = node_info.network;

        return this;
    }

    // --------------- api ------------------

    /**
     * Perform custom request
     *
     * @param uri
     * @param reqData
     * @returns {Promise<*>}
     */
    request (uri, reqData) {
        return req(this.apiUrl, {
            path: uri,
            ...reqData,
        });
    }

    /**
     * Fetch node info
     *
     * @returns {Promise<*>}
     */
    fetchNodeInfo () {
        return get(this.apiUrl, {
            path: '/node_info',
        });
    }

    /**
     * Fetch blockchain info
     *
     * @param query
     * @returns {Promise<*>}
     */
    fetchBlockchainInfo (query) {
        return get(this.nodeUrl, {
            path: '/blockchain',
            query,
        });
    }

    /**
     * Fetch block info
     *
     * @param height
     * @returns {Promise<*>}
     */
    fetchBlockInfo (height) {
        if (!height) {
            throw new Error('height was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/blocks/${height}`,
        });
    }

    /**
     * Fetch account by address
     *
     * @param address
     * @returns {Promise<*>}
     */
    fetchAccount (address) {
        if (!address) {
            throw new Error('address was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/auth/accounts/${address}`,
        });
    }

    /**
     * Fetch balance of account by address
     *
     * @param address
     * @returns {Promise<*>}
     */
    fetchAccountBalance (address) {
        if (!address) {
            throw new Error('address was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/bank/balances/${address}`,
        });
    }

    /**
     * Fetch all transaction
     *
     * @param params
     * @returns {Promise<*>}
     */
    async fetchAllTransactions (params = {}) {
        const totalCount = await this.fetchTotalTransactionsCount(params);

        return this.fetchTransactions({
            limit: totalCount,
            ...params,
        });
    }

    /**
     * Fetch all transactions
     *
     * @param params
     * @returns {Promise<*>}
     */
    fetchTransactions (params = {}) {
        let {action} = params;
        if (!action) {
            action = 'send';
        }
        delete params.action;

        return get(this.apiUrl, {
            path: '/txs',
            query: {
                'message.action': action,
                ...params,
            },
        });
    }

    /**
     * Fetch all transaction
     *
     * @param limit
     * @returns {Promise<*>}
     */
    async fetchLastTransactions (limit = 5) {
        const totalCount = await this.fetchTotalTransactionsCount();
        const page = Math.ceil(totalCount / limit) || 1;

        return this.fetchTransactions({
            limit,
            page,
        });
    }

    /**
     * Fetch total transactions count
     *
     * @param params
     * @returns {Promise<*>}
     */
    async fetchTotalTransactionsCount (params = {}) {
        const {total_count} = await this.fetchTransactions(params);
        return total_count;
    }

    /**
     * Fetch a transaction by hash in a committed block.
     *
     * @param hash
     * @returns {Promise<*>}
     */
    fetchTransaction (hash) {
        if (!hash) {
            throw new Error('hash was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/txs/${hash}`,
        });
    }

    /**
     * Fetch transaction where the address is a sender
     *
     * @param address
     * @param params
     * @returns {Promise<*>}
     */
    fetchOutboundTransactions (address, params = {limit: 30}) {
        if (!address) {
            throw new Error('address was not set or invalid');
        }

        return get(this.apiUrl, {
            path: '/txs',
            query: {
                'message.action': 'send',
                'message.sender': address,
                ...params,
            },
        });
    }

    /**
     * Fetch transactions where the address is a recipient
     *
     * @param address
     * @param params
     * @returns {Promise<*>}
     */
    fetchInboundTransactions (address, params = {limit: 30}) {
        if (!address) {
            throw new Error('address was not set or invalid');
        }

        return get(this.apiUrl, {
            path: '/txs',
            query: {
                'transfer.recipient': address,
                ...params,
            },
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
    searchTransactions (query) {
        return get(this.apiUrl, {
            path: '/txs',
            query,
        });
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
    broadcastTx (signedTx, mode = 'sync') {
        return post(this.apiUrl, {
            path: '/txs',
            data: {
                tx: signedTx,
                mode,
            },
        });
    }

    /**
     * Fetch the total supply of coins
     *
     * @returns {Promise<*>}
     */
    fetchTotalSupply () {
        return get(this.apiUrl, {
            path: '/supply/total',
        });
    }

    /**
     * Fetch the supply of a single denom
     *
     * @param       denom       Token denom
     * @returns {Promise<*>}
     */
    fetchSupplyDenom (denom) {
        if (!denom) {
            throw new Error('denom was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/supply/total/${denom}`,
        });
    }

    /**
     * Fetch staking pool
     *
     * @returns {Promise<*>}
     */
    fetchStakingPool () {
        return get(this.apiUrl, {
            path: '/staking/pool',
        });
    }

    /**
     * Fetch staking validators
     *
     * @returns {Promise<*>}
     */
    fetchStakingValidators (status) {
        if (!status) {
            throw new Error('status was not set or invalid');
        }

        return get(this.apiUrl, {
            path: '/staking/validators',
            query: {
                status,
            },
        });
    }

    /**
     * Fetch validator details
     *
     * @param address
     * @returns {Promise<*>}
     */
    fetchValidatorDetails (address) {
        if (!address) {
            throw new Error('address was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/staking/validators/${address}`,
        });
    }

    /**
     * Fetch validator sets info
     *
     * @param height
     * @returns {Promise<*>}
     */
    fetchValidatorSets (height) {
        if (!height) {
            throw new Error('height was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/validatorsets/${height}`,
        });
    }

    /**
     * Fetch gov proposals
     *
     * @returns {Promise<*>}
     */
    fetchGovProposals (params = {}) {
        return get(this.apiUrl, {
            path: '/gov/proposals',
            query: params,
        });
    }

    /**
     * Fetch gov propsal
     *
     * @param id
     * @param params
     * @returns {Promise<*>}
     */
    fetchGovProposal (id, params = {}) {
        if (!id) {
            throw new Error('id was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/gov/proposals/${id}`,
            query: params,
        });
    }

    // --------------- api ------------------

    generateAccount() {
        return new Account(this.path, this.bech32MainPrefix).generate();
    }

    recoverAccount(mnemonic) {
        return new Account(this.path, this.bech32MainPrefix).recover(mnemonic);
    }

    buildMsg(input) {
        const msgType = this.msgBuilder.getMsgType(input.type);

        return msgType.build(input);
    }

    buildSignMsg(msg, txInfo) {
        return this.txBuilder.build(msg, txInfo);
    }

    signWithAccount(stdSignMsg, account) {
        return this.sign(stdSignMsg, account.getPrivateKey(), account.getPublicKey());
    }

    sign(stdSignMsg, privateKey, publicKey) {
        return this.txBuilder.sign(stdSignMsg, privateKey, publicKey);
    }

    transferFromAccount ({
                             from,
                             to,
                             amount,
                             denom = DEFAULT_DENOM,
                             fee = DEFAULT_FEE,
                             feeDenom = DEFAULT_DENOM,
                             gas = DEFAULT_GAS,
                             memo = '',
                         }) {
        if (!this.chainId) {
            throw new Error('chainId object was not set or invalid');
        }

        return this.transfer({
            from: from.getAddress(),
            privateKey: from.getPrivateKey(),
            publicKey: from.getPublicKey(),
            accountNumber: from.getAccountNumber(),
            sequence: from.getSequence(),
            to,
            amount,
            denom,
            fee,
            feeDenom,
            gas,
            memo,
        });
    }

    transfer ({
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
                  memo = '',
              }) {
        if (!this.chainId) {
            throw new Error('chainId object was not set or invalid');
        }

        const msg = this.buildMsg({
            type: 'cosmos-sdk/MsgSend',
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
            sequence,
        });
        const signedTx = this.sign(tx, privateKey, publicKey);
        return this.broadcastTx(signedTx);
    }
}

function network(config) {
    return new Chain(config);
}

export default {
    network,
};

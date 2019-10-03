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
     * Fetch the current state of the staking pool
     *
     * @returns {Promise<*>}
     */
    fetchStakingPool () {
        return get(this.apiUrl, {
            path: '/staking/pool',
        });
    }

    /**
     * Fetch staking validators. Get all validator candidates.
     * By default it returns only the bonded validators.
     * @param status The validator bond status. Must be either 'bonded’, 'unbonded’, or 'unbonding’.
     * @param params page, limit
     * @returns {Promise<*>}
     */
    fetchValidators (status = undefined, params = {}) {
        const query = status ? {status, ...params} : params;

        return get(this.apiUrl, {
            path: '/staking/validators',
            query,
        });
    }

    /**
     * Fetch the information from a single validator
     *
     * @param validatorAddr Bech32 OperatorAddress of Validator
     * @returns {Promise<*>}
     */
    fetchValidatorDetails (validatorAddr) {
        if (!validatorAddr) {
            throw new Error('validatorAddr was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/staking/validators/${validatorAddr}`,
        });
    }

    /**
     * Fetch all delegations from a delegator
     *
     * @param delegatorAddr Bech32 AccAddress of Delegator
     * @returns {Promise<*>}
     */
    fetchDelegatorDelegations (delegatorAddr) {
        if (!delegatorAddr) {
            throw new Error('delegatorAddr was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/staking/delegators/${delegatorAddr}/delegations`,
        });
    }

    /**
     * Fetch the current delegation between a delegator and a validator
     *
     * @param delegatorAddr Bech32 AccAddress of Delegator
     * @param validatorAddr Bech32 OperatorAddress of validator
     * @returns {Promise<*>}
     */
    fetchDelegatorDelegation (delegatorAddr, validatorAddr) {
        if (!delegatorAddr) {
            throw new Error('delegatorAddr was not set or invalid');
        }
        if (!validatorAddr) {
            throw new Error('validatorAddr was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/staking/delegators/${delegatorAddr}/delegations/${validatorAddr}`,
        });
    }

    /**
     * Fetch all unbonding delegations from a delegator
     *
     * @param delegatorAddr Bech32 AccAddress of Delegator
     * @returns {Promise<*>}
     */
    fetchDelegatorUnbondingDelegations (delegatorAddr) {
        if (!delegatorAddr) {
            throw new Error('delegatorAddr was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/staking/delegators/${delegatorAddr}/unbonding_delegations`,
        });
    }

    /**
     * Fetch the current unbonding delegation from a delegator with the validator
     *
     * @param delegatorAddr Bech32 AccAddress of Delegator
     * @param validatorAddr Bech32 AccAddress of Validator
     * @returns {Promise<*>}
     */
    fetchDelegatorUnbondingDelegation (delegatorAddr, validatorAddr) {
        if (!delegatorAddr) {
            throw new Error('delegatorAddr was not set or invalid');
        }
        if (!validatorAddr) {
            throw new Error('validatorAddr was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/staking/delegators/${delegatorAddr}/unbonding_delegations/${validatorAddr}`,
        });
    }

    /**
     * Fetch the total rewards balance from all delegations
     *
     * @param delegatorAddr Bech32 AccAddress of Delegator
     * @returns {Promise<*>}
     */
    fetchDelegatorRewards (delegatorAddr) {
        if (!delegatorAddr) {
            throw new Error('delegatorAddr was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/distribution/delegators/${delegatorAddr}/rewards`,
        });
    }

    /**
     * Fetch a delegation reward
     *
     * @param delegatorAddr Bech32 AccAddress of Delegator
     * @param validatorAddr Bech32 OperatorAddress of validator
     * @returns {Promise<*>}
     */
    fetchDelegatorReward (delegatorAddr, validatorAddr) {
        if (!delegatorAddr) {
            throw new Error('delegatorAddr was not set or invalid');
        }
        if (!validatorAddr) {
            throw new Error('validatorAddr was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/distribution/delegators/${delegatorAddr}/rewards/${validatorAddr}`,
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

    generateAccount () {
        return new Account(this.bech32MainPrefix, this.path).generate();
    }

    recoverAccount (mnemonic) {
        return new Account(this.bech32MainPrefix, this.path).recover(mnemonic);
    }

    importAccountFromV3KeyStore (keyStore, pass) {
        return new Account(this.bech32MainPrefix, this.path).fromV3KeyStore(keyStore, pass);
    }

    exportAccountToV3KeyStore (account, pass) {
        return account.toV3KeyStore(pass);
    }

    buildMsg (input = {
        type: 'cosmos-sdk/MsgSend',
        from_address: '',
        to_address: '',
        denom: DEFAULT_DENOM,
        amount: 0,
    }) {
        const msgType = this.msgBuilder.getMsgType(input.type);

        return msgType.build(input);
    }

    /**
     *
     * @param msg
     * @param txInfo
     * @returns {StdSignMsg}
     */
    buildSignMsg (msg, txInfo = {
        chainId: this.chainId,
        fee: {
            denom: DEFAULT_DENOM,
            amount: DEFAULT_FEE,
        },
        gas: DEFAULT_GAS,
        memo: '',
        accountNumber: 0,
        sequence: 0,
    }) {
        return this.txBuilder.build(msg, txInfo);
    }

    signWithAccount (stdSignMsg, account) {
        return this.sign(stdSignMsg, account.getPrivateKey(), account.getPublicKeyEncoded());
    }

    sign (stdSignMsg, privateKey, publicKey) {
        return this.txBuilder.sign(stdSignMsg, privateKey, publicKey);
    }

    /**
     *
     * @param msg {{amount: *, from: *, to: *, type: string}}
     * @param fee
     * @param gas
     * @param memo
     * @param accountNumber
     * @param sequence
     * @param privateKey
     * @param publicKey
     * @returns {Promise<*>}
     */
    buildSignBroadcast (msg, {
        fee = {
            amount: DEFAULT_FEE,
            denom: DEFAULT_DENOM,
        },
        gas = DEFAULT_GAS,
        memo = '',
    }, {accountNumber, sequence, privateKey, publicKey}) {
        if (!this.chainId) {
            throw new Error('chainId object was not set or invalid');
        }
        if (!msg) {
            throw new Error('msg object was not set or invalid');
        }
        if (!accountNumber) {
            throw new Error('accountNumber object was not set or invalid');
        }
        if (!sequence) {
            throw new Error('sequence object was not set or invalid');
        }
        if (!privateKey) {
            throw new Error('privateKey object was not set or invalid');
        }
        if (!publicKey) {
            throw new Error('publicKey object was not set or invalid');
        }

        const stdMsg = this.buildMsg(msg);
        const tx = this.buildSignMsg(stdMsg, {
            chainId: this.chainId,
            fee,
            gas,
            memo,
            accountNumber,
            sequence,
        });
        const signedTx = this.sign(tx, privateKey, publicKey);

        return this.broadcastTx(signedTx);
    }

    /**
     *
     * @param params {from, to, amount, fee, gas, memo}
     * @returns {*}
     */
    transferWithAccount (params) {
        const {from} = params;
        if (!from) {
            throw new Error('from object was not set or invalid');
        }

        return this.transfer({
            ...params,
            from: from.getAddress(),
            privateKey: from.getPrivateKey(),
            publicKey: from.getPublicKeyEncoded(),
            accountNumber: from.getAccountNumber(),
            sequence: from.getSequence(),
        });
    }

    /**
     *
     * @param from
     * @param accountNumber
     * @param sequence
     * @param privateKey
     * @param publicKey
     * @param to
     * @param amount
     * @param fee
     * @param gas
     * @param memo
     * @returns {*}
     */
    transfer ({from, accountNumber, sequence, privateKey, publicKey, to, amount, fee, gas, memo}) {
        if (!from) {
            throw new Error('from object was not set or invalid');
        }
        if (!to) {
            throw new Error('to object was not set or invalid');
        }
        if (!amount) {
            throw new Error('chainId object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: 'cosmos-sdk/MsgSend',
            from,
            to,
            amount,
        }, {fee, gas, memo}, {accountNumber, sequence, privateKey, publicKey});
    }

    /**
     *
     * @param params {delegator, validator, amount, fee, gas, memo}
     * @returns {*}
     */
    delegateWithAccount (params) {
        const {delegator} = params;
        if (!delegator) {
            throw new Error('delegator object was not set or invalid');
        }

        return this.delegate({
            ...params,
            delegatorAddr: delegator.getAddress(),
            privateKey: delegator.getPrivateKey(),
            publicKey: delegator.getPublicKeyEncoded(),
            accountNumber: delegator.getAccountNumber(),
            sequence: delegator.getSequence(),
        });
    }

    /**
     *
     * @param delegatorAddr
     * @param accountNumber
     * @param sequence
     * @param privateKey
     * @param publicKey
     * @param validatorAddr
     * @param amount
     * @param fee
     * @param gas
     * @param memo
     * @returns {*}
     */
    delegate ({delegatorAddr, accountNumber, sequence, privateKey, publicKey, validatorAddr, amount, fee, gas, memo}) {
        if (!delegatorAddr) {
            throw new Error('delegatorAddr object was not set or invalid');
        }
        if (!validatorAddr) {
            throw new Error('validatorAddr object was not set or invalid');
        }
        if (!amount) {
            throw new Error('amount object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: 'cosmos-sdk/MsgDelegate',
            delegatorAddr,
            validatorAddr,
            amount,
        }, {fee, gas, memo}, {accountNumber, sequence, privateKey, publicKey});
    }

    /**
     *
     * @param params {delegator, validatorAddrFrom, validatorAddrTo, amount, fee, gas, memo}
     * @returns {*}
     */
    redelegateWithAccount (params) {
        const {delegator} = params;
        if (!delegator) {
            throw new Error('delegator object was not set or invalid');
        }

        return this.redelegate({
            ...params,
            delegatorAddr: delegator.getAddress(),
            privateKey: delegator.getPrivateKey(),
            publicKey: delegator.getPublicKeyEncoded(),
            accountNumber: delegator.getAccountNumber(),
            sequence: delegator.getSequence(),
        });
    }

    /**
     *
     * @param delegatorAddr
     * @param accountNumber
     * @param sequence
     * @param privateKey
     * @param publicKey
     * @param validatorAddrFrom
     * @param validatorAddrTo
     * @param amount
     * @param fee
     * @param gas
     * @param memo
     * @returns {*}
     */
    redelegate ({delegatorAddr, accountNumber, sequence, privateKey, publicKey, validatorAddrFrom, validatorAddrTo, amount, fee, gas, memo}) {
        if (!delegatorAddr) {
            throw new Error('delegatorAddr object was not set or invalid');
        }
        if (!validatorAddrFrom) {
            throw new Error('validatorAddrFrom object was not set or invalid');
        }
        if (!validatorAddrTo) {
            throw new Error('validatorAddrTo object was not set or invalid');
        }
        if (!amount) {
            throw new Error('amount object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: 'cosmos-sdk/MsgBeginRedelegate',
            delegatorAddr,
            validatorAddrFrom,
            validatorAddrTo,
            amount,
        }, {fee, gas, memo}, {accountNumber, sequence, privateKey, publicKey});
    }

    /**
     *
     * @param params {delegator, validator, amount, fee, gas, memo}
     * @returns {*}
     */
    undelegateWithAccount (params) {
        const {delegator} = params;
        if (!delegator) {
            throw new Error('delegator object was not set or invalid');
        }

        return this.undelegate({
            ...params,
            delegatorAddr: delegator.getAddress(),
            privateKey: delegator.getPrivateKey(),
            publicKey: delegator.getPublicKeyEncoded(),
            accountNumber: delegator.getAccountNumber(),
            sequence: delegator.getSequence(),
        });
    }

    /**
     *
     * @param delegatorAddr
     * @param accountNumber
     * @param sequence
     * @param privateKey
     * @param publicKey
     * @param validatorAddr
     * @param amount
     * @param fee
     * @param gas
     * @param memo
     * @returns {*}
     */
    undelegate ({delegatorAddr, accountNumber, sequence, privateKey, publicKey, validatorAddr, amount, fee, gas, memo}) {
        if (!delegatorAddr) {
            throw new Error('delegatorAddr object was not set or invalid');
        }
        if (!validatorAddr) {
            throw new Error('validatorAddr object was not set or invalid');
        }
        if (!amount) {
            throw new Error('amount object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: 'cosmos-sdk/MsgUndelegate',
            delegatorAddr,
            validatorAddr,
            amount,
        }, {fee, gas, memo}, {accountNumber, sequence, privateKey, publicKey});
    }

    /**
     * Withdraw a delegation reward
     *
     * @param params {delegator, validatorAddr}
     * @returns {*}
     */
    withDrawDelegationRewardWithAccount (params) {
        const {delegator} = params;
        if (!delegator) {
            throw new Error('delegator object was not set or invalid');
        }

        return this.withDrawDelegationReward({
            ...params,
            delegatorAddr: delegator.getAddress(),
            privateKey: delegator.getPrivateKey(),
            publicKey: delegator.getPublicKeyEncoded(),
            accountNumber: delegator.getAccountNumber(),
            sequence: delegator.getSequence(),
        });
    }

    /**
     * Withdraw a delegation reward
     *
     * @param delegatorAddr
     * @param accountNumber
     * @param sequence
     * @param privateKey
     * @param publicKey
     * @param validatorAddr
     * @param fee
     * @param gas
     * @param memo
     * @returns {Promise<*>}
     */
    withDrawDelegationReward ({delegatorAddr, accountNumber, sequence, privateKey, publicKey, validatorAddr, fee, gas, memo}) {
        if (!delegatorAddr) {
            throw new Error('delegatorAddr object was not set or invalid');
        }
        if (!validatorAddr) {
            throw new Error('validatorAddr object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: 'cosmos-sdk/MsgWithdrawDelegationReward',
            delegatorAddr,
            validatorAddr,
        }, {fee, gas, memo}, {accountNumber, sequence, privateKey, publicKey});
    }

    /**
     * Withdraw all the delegator's delegation rewards
     *
     * @param params {delegator}
     * @returns {Promise<*>}
     */
    withDrawDelegationRewardsWithAccount (params) {
        const {delegator} = params;
        if (!delegator) {
            throw new Error('delegator object was not set or invalid');
        }

        return this.withDrawDelegationsReward({
            ...params,
            delegatorAddr: delegator.getAddress(),
            privateKey: delegator.getPrivateKey(),
            publicKey: delegator.getPublicKeyEncoded(),
            accountNumber: delegator.getAccountNumber(),
            sequence: delegator.getSequence(),
        });
    }

    /**
     * Withdraw all the delegator's delegation rewards
     *
     * @param delegatorAddr
     * @param accountNumber
     * @param sequence
     * @param privateKey
     * @param publicKey
     * @param fee
     * @param gas
     * @param memo
     * @returns {Promise<*>}
     */
    withDrawDelegationsReward ({delegatorAddr, accountNumber, sequence, privateKey, publicKey, fee, gas, memo}) {
        if (!delegatorAddr) {
            throw new Error('delegatorAddr object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: 'cosmos-sdk/MsgWithdrawDelegationRewardsAll',
            delegatorAddr,
        }, {fee, gas, memo}, {accountNumber, sequence, privateKey, publicKey});
    }
}

function network (config) {
    return new Chain(config);
}

export default {
    network,
};

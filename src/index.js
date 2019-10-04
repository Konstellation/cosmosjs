import Account from './utils/types/Account';
import TxBuilder from './utils/types/TxBuilder';
import MsgBuilder from './utils/types/MsgBuilder';

import get from './helpers/request/get';
import post from './helpers/request/post';
import req from './helpers/request/req';

import {
    DEFAULT_BECH32_PREFIX,
    DEFAULT_KEY_PATH,
} from './utils/constants';
import MsgSend from './utils/types/msgtypes/MsgSend';
import MsgDelegate from './utils/types/msgtypes/MsgDelegate';
import MsgBeginRedelegate from './utils/types/msgtypes/MsgBeginRedelegate';
import MsgUndelegate from './utils/types/msgtypes/MsgUndelegate';
import MsgWithdrawDelegationReward from './utils/types/msgtypes/MsgWithdrawDelegationReward';
import MsgWithdrawDelegationRewardsAll
    from './utils/types/msgtypes/MsgWithdrawDelegationRewardsAll';

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

    /**
     * Generate account
     *
     * @returns {Account}
     */
    generateAccount () {
        return new Account(this.bech32MainPrefix, this.path).generate();
    }

    /**
     * Recover account from mnemonic
     *
     * @param {string} mnemonic
     * @returns {Account}
     */
    recoverAccount (mnemonic) {
        return new Account(this.bech32MainPrefix, this.path).recover(mnemonic);
    }

    /**
     * Import account using key store v3
     *
     * @param keyStore
     * @param {string} pass
     * @returns {Account}
     */
    importAccountFromV3KeyStore (keyStore, pass) {
        return new Account(this.bech32MainPrefix, this.path).fromV3KeyStore(keyStore, pass);
    }

    /**
     * Import account by mnemonic or key store
     *
     * @param ks
     * @param {string} pass
     * @param {string} mnemonic
     * @returns {Account}
     */
    importAccount ({ks, pass, mnemonic}) {
        if ((!ks || !pass) || ((!ks || !pass) && !mnemonic))
            throw new Error('secret info was not set or invalid');

        return mnemonic
            ? this.recoverAccount(mnemonic)
            : this.importAccountFromV3KeyStore(ks, pass);
    }

    /**
     * Export account to key store v3
     *
     * @param {Account} account
     * @param {string} pass
     * @returns {*|{address, id, version, crypto}}
     */
    exportAccountToV3KeyStore (account, pass) {
        return account.toV3KeyStore(pass);
    }

    /**
     * Build message with input params
     *
     * @param {string} type
     * @param input
     * @returns {Msg}
     */
    buildMsg ({type = MsgSend.type, ...input}) {
        return this.msgBuilder.getMsgType(type).build(input);
    }

    /**
     * Build std msg prepared for sign
     *
     * @param {Msg} msg
     * @param txInfo {{fee: *, gas: number, memo: string, accountNumber: number, sequence: number}}

     * @returns {StdSignMsg}
     */
    buildSignMsg (msg, txInfo) {
        return this.txBuilder.build(msg, {
            chainId: this.chainId,
            ...txInfo,
        });
    }

    /**
     * Sign message using account
     *
     * @param {StdSignMsg} stdSignMsg
     * @param {Account} account
     * @returns {*}
     */
    signWithAccount (stdSignMsg, account) {
        if (!account) {
            throw new Error('account object was not set or invalid');
        }

        return this.sign(stdSignMsg, account.getPrivateKey(), account.getPublicKeyEncoded());
    }

    /**
     * Sign message using private key of the account
     *
     * @param {StdSignMsg} stdSignMsg
     * @param privateKey
     * @param {string} publicKey
     * @returns {StdTx}
     */
    sign (stdSignMsg, privateKey, publicKey) {
        return this.txBuilder.sign(stdSignMsg, privateKey, publicKey);
    }

    /**
     * Build, sign and broadcast message
     *
     * @param msg {{type: string}}
     * @param privateKey
     * @param {string} publicKey
     * @param txInfo {{fee: *, gas: number, memo: string, accountNumber: number, sequence: number}}
     * @returns {StdTx}
     */
    buildSign (msg, {privateKey, publicKey, ...txInfo}) {
        if (!msg) {
            throw new Error('msg object was not set or invalid');
        }

        return this.sign(
            this.buildSignMsg(
                this.buildMsg(msg), txInfo), privateKey, publicKey);
    }

    /**
     * Build, sign and broadcast message
     *
     * @param msg {{type: string}}
     * @param txInfo {{privateKey: *, publicKey: string, fee: *, gas: number, memo: string, accountNumber: number, sequence: number}}
     * @returns {Promise<*>}
     */
    buildSignBroadcast (msg, txInfo) {
        return this.broadcastTx(
            this.buildSign(msg, txInfo));
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
     * @param {string} address
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
     * Fetch transactions
     * @param {string|*} action
     * @param params
     * @returns {Promise<*>}
     */
    fetchTransactions ({action, ...params}) {
        if (!action) {
            action = 'send';
        }

        return get(this.apiUrl, {
            path: '/txs',
            query: {
                'message.action': action,
                ...params,
            },
        });
    }

    /**
     * Fetch last transaction
     *
     * @param {number} limit
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
     * @param {string} hash
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
     * @param {string} address
     * @param params {{ limit: number, page: number|* }}
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
     * @param {string} address
     * @param params {{ limit: number, page: number|* }}
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
     * Search transactions by events.
     *
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
     * Broadcast a signed tx to a full node
     *
     * BroadcastTx broadcasts a transactions either synchronously or asynchronously
     * based on the context parameters.
     * "block"(return after tx commit), "sync"(return afer CheckTx) and "async"(return right away).
     *
     * @param {StdTx} tx
     * @param {string} mode
     * @returns {Promise<*>}
     */
    broadcastTx (tx, mode = 'sync') {
        return post(this.apiUrl, {
            path: '/txs',
            data: {
                tx,
                mode,
            },
        });
    }

    /**
     * Send coins from one account to another
     *
     * @param {Account} from
     * @param params {{to: string, amount, fee, gas, memo: string}}
     * @returns {*}
     */
    async transferWithAccount ({from, ...params}) {
        if (!from) {
            throw new Error('from object was not set or invalid');
        }

        const {result: {value}} = await this.fetchAccount(from.getAddress());
        from.updateInfo(value);

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
     * Send coins from one account to another
     *
     * @param {string} from
     * @param {string} to
     * @param amount
     * @param txInfo {{fee: *, gas: number, memo: string, accountNumber: number, sequence: number, privateKey: *, publicKey: string}}
     * @returns {*}
     */
    transfer ({from, to, amount, ...txInfo}) {
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
            type: MsgSend.type,
            from,
            to,
            amount,
        }, txInfo);
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
     * Fetch the supply of a single coin denomination
     *
     * @param {string} denom Coin denom
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
     * Fetch the current state of the staking pool
     *
     * @returns {Promise<*>}
     */
    fetchStakingParameters () {
        return get(this.apiUrl, {
            path: '/staking/parameters',
        });
    }

    /**
     * Fetch staking validators. Get all validator candidates.
     * By default it returns only the bonded validators.
     *
     * @param {string} status The validator bond status. Must be either 'bonded’, 'unbonded’, or 'unbonding’.
     * @param params {{ page: number, limit: number }}
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
     * @param {string} validatorAddr Bech32 OperatorAddress of Validator
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
     * Fetch all delegations from a validator
     *
     * @param {string} validatorAddr Bech32 OperatorAddress of Validator
     * @returns {Promise<*>}
     */
    fetchValidatorDelegations (validatorAddr) {
        if (!validatorAddr) {
            throw new Error('validatorAddr was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/staking/validators/${validatorAddr}/delegations`,
        });
    }

    /**
     * Fetch all unbonding delegations from a validator
     *
     * @param {string} validatorAddr Bech32 OperatorAddress of Validator
     * @returns {Promise<*>}
     */
    fetchValidatorUnbondingDelegations (validatorAddr) {
        if (!validatorAddr) {
            throw new Error('validatorAddr was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/staking/validators/${validatorAddr}/unbonding_delegations`,
        });
    }

    /**
     * Fetch all delegations from a delegator
     *
     * @param {string} delegatorAddr Bech32 AccAddress of Delegator
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
     * @param {string} delegatorAddr Bech32 AccAddress of Delegator
     * @param {string} validatorAddr Bech32 OperatorAddress of validator
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
     * @param {string} delegatorAddr Bech32 AccAddress of Delegator
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
     * Fetch all unbonding delegations between a delegator and a validator
     *
     * @param {string} delegatorAddr Bech32 AccAddress of Delegator
     * @param {string} validatorAddr Bech32 AccAddress of Validator
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
     * Fetch all redelegations
     *
     * @param {string} delegatorAddr Bech32 AccAddress of Delegator
     * @param {string} validatorSrcAddr Bech32 AccAddress of SrcValidator
     * @param {string} validatorDstAddr Bech32 AccAddress of DstValidator
     * @returns {Promise<*>}
     */
    fetchDelegatorRedelegations (delegatorAddr, validatorSrcAddr, validatorDstAddr) {
        return get(this.apiUrl, {
            path: '/staking/redelegations',
            query: {
                delegator_address: delegatorAddr,
                validator_from: validatorSrcAddr,
                validator_to: validatorDstAddr,
            },
        });
    }

    /**
     * Submit the delegation with account
     *
     * @param {Account} delegator
     * @param params {{amount: *, fee: *, validatorAddr: string}}
     * @returns {*}
     */
    async delegateWithAccount ({delegator, ...params}) {
        if (!delegator) {
            throw new Error('delegator object was not set or invalid');
        }

        const {result: {value}} = await this.fetchAccount(delegator.getAddress());
        delegator.updateInfo(value);

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
     * Submit delegation
     *
     * @param {string} delegatorAddr
     * @param {string} validatorAddr
     * @param amount
     * @param txInfo {{fee: *, gas: number, memo: string, accountNumber: number, sequence: number, privateKey: *, publicKey: string}}
     * @returns {*}
     */
    delegate ({delegatorAddr, validatorAddr, amount, ...txInfo}) {
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
            type: MsgDelegate.type,
            delegatorAddr,
            validatorAddr,
            amount,
        }, txInfo);
    }

    /**
     * Submit a redelegation
     *
     * @param {Account} delegator
     * @param params {{amount: *, fee: *, validatorSrcAddr: string, validatorDstAddr: string}}
     * @returns {*}
     */
    async redelegateWithAccount ({delegator, ...params}) {
        if (!delegator) {
            throw new Error('delegator object was not set or invalid');
        }

        const {result: {value}} = await this.fetchAccount(delegator.getAddress());
        delegator.updateInfo(value);

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
     * Submit a redelegation
     *
     * @param {string} delegatorAddr
     * @param {string} validatorSrcAddr
     * @param {string} validatorDstAddr
     * @param amount
     * @param txInfo {{fee: *, gas: number, memo: string, accountNumber: number, sequence: number, privateKey: *, publicKey: string}}
     * @returns {*}
     */
    redelegate ({delegatorAddr, validatorSrcAddr, validatorDstAddr, amount, ...txInfo}) {
        if (!delegatorAddr) {
            throw new Error('delegatorAddr object was not set or invalid');
        }
        if (!validatorSrcAddr) {
            throw new Error('validatorSrcAddr object was not set or invalid');
        }
        if (!validatorDstAddr) {
            throw new Error('validatorDstAddr object was not set or invalid');
        }
        if (!amount) {
            throw new Error('amount object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: MsgBeginRedelegate.type,
            delegatorAddr,
            validatorSrcAddr,
            validatorDstAddr,
            amount,
        }, txInfo);
    }

    /**
     * Submit an unbonding delegation
     *
     * @param {Account} delegator
     * @param params {{amount: *, fee: *, validatorAddr: string}}
     * @returns {*}
     */
    async undelegateWithAccount ({delegator, ...params}) {
        if (!delegator) {
            throw new Error('delegator object was not set or invalid');
        }

        const {result: {value}} = await this.fetchAccount(delegator.getAddress());
        delegator.updateInfo(value);

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
     * Submit an unbonding delegation
     *
     * @param {string} delegatorAddr
     * @param {string} validatorAddr
     * @param amount
     * @param txInfo {{fee: *, gas: number, memo: string, accountNumber: number, sequence: number, privateKey: *, publicKey: string}}
     * @returns {*}
     */
    undelegate ({delegatorAddr, validatorAddr, amount, ...txInfo}) {
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
            type: MsgUndelegate.type,
            delegatorAddr,
            validatorAddr,
            amount,
        }, txInfo);
    }

    /**
     * Fetch the total rewards balance from all delegations
     *
     * @param {string} delegatorAddr Bech32 AccAddress of Delegator
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
     * @param {string} delegatorAddr Bech32 AccAddress of Delegator
     * @param {string} validatorAddr Bech32 OperatorAddress of validator
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
     * Withdraw a delegation reward
     *
     * @param {Account} delegator
     * @param params {{delegator: Account, validatorAddr: string}}
     * @returns {*}
     */
    withDrawDelegationRewardWithAccount ({delegator, ...params}) {
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
     * @param {string} delegatorAddr
     * @param {string} validatorAddr
     * @param txInfo {{accountNumber: number, gas: number, memo: string, sequence: number, privateKey: *, publicKey: string}}
     * @returns {Promise<*>}
     */
    withDrawDelegationReward ({delegatorAddr, validatorAddr, ...txInfo}) {
        if (!delegatorAddr) {
            throw new Error('delegatorAddr object was not set or invalid');
        }
        if (!validatorAddr) {
            throw new Error('validatorAddr object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: MsgWithdrawDelegationReward.type,
            delegatorAddr,
            validatorAddr,
        }, txInfo);
    }

    /**
     * Withdraw all the delegator's delegation rewards
     *
     * @param {Account} delegator
     * @param params
     * @returns {Promise<*>}
     */
    withDrawDelegationRewardsWithAccount ({delegator, ...params}) {
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
     * @param {string} delegatorAddr
     * @param txInfo {{gas: number, memo: string, accountNumber: number, sequence: number, privateKey: *, publicKey: string}}
     * @returns {Promise<*>}
     */
    withDrawDelegationsReward ({delegatorAddr, ...txInfo}) {
        if (!delegatorAddr) {
            throw new Error('delegatorAddr object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: MsgWithdrawDelegationRewardsAll.type,
            delegatorAddr,
        }, txInfo);
    }

    /**
     * Fetch validator sets info
     *
     * @param {number} height
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
     * Fetch gov proposal
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
}

function network (config) {
    return new Chain(config);
}

export default {
    network,
};

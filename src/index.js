import Account from './types/Account';
import TxBuilder from './types/TxBuilder';
import MsgBuilder from './types/MsgBuilder';

import get from './helpers/request/get';
import post from './helpers/request/post';
import req from './helpers/request/req';

import {
    DEFAULT_BECH32_PREFIX,
    DEFAULT_DENOM,
    DEFAULT_KEY_PATH,
} from './constants';

import MsgSend from './types/msgtypes/MsgSend';
import MsgDelegate from './types/msgtypes/MsgDelegate';
import MsgBeginRedelegate from './types/msgtypes/MsgBeginRedelegate';
import MsgUndelegate from './types/msgtypes/MsgUndelegate';
import MsgUnjail from './types/msgtypes/MsgUnjail';
import MsgDeposit from './types/msgtypes/MsgDeposit';
import MsgVote from './types/msgtypes/MsgVote';
import MsgWithdrawDelegationReward from './types/msgtypes/MsgWithdrawDelegationReward';
import MsgEditValidator from "./types/msgtypes/MsgEditValidator";
import MsgIssueCreate from "./types/msgtypes/MsgIssueCreate";
import MsgIssueApprove from "./types/msgtypes/MsgIssueApprove";
import MsgIssueTransfer from "./types/msgtypes/MsgIssueTransfer";
import MsgIssueTransferFrom from "./types/msgtypes/MsgIssueTransferFrom";
import MsgIssueIncreaseAllowance from "./types/msgtypes/MsgIssueIncreaseAllowance";
import MsgIssueDecreaseAllowance from "./types/msgtypes/MsgIssueDecreaseAllowance";
import MsgIssueMint from "./types/msgtypes/MsgIssueMint";

import Socket from './ws';

class Chain {
    /**
     *
     * @param apiUrl
     * @param nodeUrl
     * @param chainId
     * @param bech32MainPrefix
     * @param path
     */
    constructor(
        {
            apiUrl,
            nodeUrl,
            chainId,
            bech32MainPrefix = DEFAULT_BECH32_PREFIX,
            path = DEFAULT_KEY_PATH,
        },
    ) {
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

        this.socket = new Socket(this.nodeUrl);

        // Object.entries(api).forEach(([name, func]) => Chain.prototype[name] = func);
    }

    /**
     * Generate account
     *
     * @returns {Account}
     */
    generateAccount() {
        return new Account(this.bech32MainPrefix, this.path).generate();
    }

    /**
     * Recover account from mnemonic
     *
     * @param {string} mnemonic
     * @returns {Account}
     */
    recoverAccount(mnemonic) {
        return new Account(this.bech32MainPrefix, this.path).recover(mnemonic);
    }

    /**
     * Import account using key store v3
     *
     * @param {*} keyStore
     * @param {string} pass
     * @returns {Account}
     */
    importAccountFromV3KeyStore(keyStore, pass) {
        return new Account(this.bech32MainPrefix, this.path).fromV3KeyStore(keyStore, pass);
    }

    /**
     * Import account by mnemonic or key store
     *
     * @param {*} keyStore
     * @param {string|*} pass
     * @param {string|*} mnemonic
     * @returns {Account}
     */
    importAccount({ keyStore, pass, mnemonic }) {
        if ((!keyStore || !pass) || ((!keyStore || !pass) && !mnemonic)) {
            throw new Error('secret info was not set or invalid');
        }

        return mnemonic
            ? this.recoverAccount(mnemonic)
            : this.importAccountFromV3KeyStore(keyStore, pass);
    }

    /**
     * Export account to key store v3
     *
     * @param {Account} account
     * @param {string} pass
     * @returns {*|{address, id, version, crypto}}
     */
    exportAccountToV3KeyStore(account, pass) {
        return account.toV3KeyStore(pass);
    }

    /**
     * Build message with input params
     *
     * @param {string} type
     * @param {*} input
     * @returns {Msg}
     */
    buildMsg({ type = MsgSend.type, ...input }) {
        return this.msgBuilder.getMsgType(type)
            .build(input);
    }

    /**
     * Build std msg prepared for sign
     *
     * @param {Msg} msg
     * @param txInfo {{
     *              fee: *,
     *              gas: number,
     *              memo: string,
     *              accountNumber: number,
     *              sequence: number
     *        }}

     * @returns {StdSignMsg}
     */
    buildSignMsg(msg, txInfo) {
        return this.txBuilder.build(msg, {
            chainId: this.chainId,
            ...txInfo,
        });
    }

    /**
     * Build base requirement for direct request
     *
     * @param txInfo {{
     *              fee: *,
     *              gas: number,
     *              memo: string,
     *              accountNumber: number,
     *              sequence: number
     *        }}
     * @returns {BaseReq}
     */
    buildBaseReq(txInfo) {
        return this.txBuilder.baseReq(txInfo);
    }

    /**
     * Sign message using account
     *
     * @param {StdSignMsg} stdSignMsg
     * @param {Account} account
     * @returns {*}
     */
    signWithAccount(stdSignMsg, account) {
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
    sign(stdSignMsg, privateKey, publicKey) {
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
    buildSign(msg, { privateKey, publicKey, ...txInfo }) {
        if (!msg) {
            throw new Error('msg object was not set or invalid');
        }

        return this.sign(
            this.buildSignMsg(
                this.buildMsg(msg),
                txInfo,
            ),
            privateKey,
            publicKey,
        );
    }

    /**
     * Build, sign and broadcast message
     *
     * @param msg
     * @param privateKey
     * @param {string} publicKey
     * @param txInfo {{fee: *, gas: number, memo: string, accountNumber: number, sequence: number}}
     * @returns {StdTx}
     */
    buildSignTx({ value: { msg } }, { privateKey, publicKey, ...txInfo }) {
        if (!msg) {
            throw new Error('msg object was not set or invalid');
        }

        return this.sign(
            this.buildSignMsg(msg, txInfo),
            privateKey,
            publicKey,
        );
    }

    /**
     * Build, sign and broadcast message
     *
     * @param msg {{type: string}}
     * @param txInfo {{privateKey: *, publicKey: string, fee: *, gas: number, memo: string, accountNumber: number, sequence: number}}
     * @returns {Promise<*>}
     */
    buildSignBroadcast(msg, txInfo) {
        return this.broadcastTx(
            this.buildSign(msg, txInfo),
        );
    }

    /**
     * Sign and broadcast tx
     *
     * @param stdTx
     * @param txInfo {{privateKey: *, publicKey: string}}
     * @returns {Promise<*>}
     */
    buildSignBroadcastTx(stdTx, txInfo) {
        return this.broadcastTx(
            this.buildSignTx(stdTx, txInfo),
        );
    }

    // --------------- api ------------------

    /**
     * Perform custom request
     *
     * @param uri
     * @param reqData
     * @returns {Promise<*>}
     */
    request(uri, reqData) {
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
    fetchNodeInfo() {
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
    fetchBlockchainInfo(query) {
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
    fetchBlockInfo(height) {
        if (!height) {
            throw new Error('height was not set or invalid');
        }

        return get(this.nodeUrl, {
            path: '/block',
            query: {
                height,
            },
        });
    }

    /**
     * Fetch account by address
     *
     * @param address
     * @returns {Promise<*>}
     */
    fetchAccount(address) {
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
    fetchAccountBalance(address) {
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
    async fetchAllTransactions(params = {}) {
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
    fetchTransactions({ action = 'send', ...params }) {
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
    async fetchLastTransactions(limit = 5) {
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
    async fetchTotalTransactionsCount(params = {}) {
        const { total_count } = await this.fetchTransactions(params);

        return total_count;
    }

    /**
     * Fetch a transaction by hash in a committed block.
     *
     * @param {string} hash
     * @returns {Promise<*>}
     */
    fetchTransaction(hash) {
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
    fetchOutboundTransactions(address, params = { limit: 30 }) {
        if (!address) {
            throw new Error('address was not set or invalid');
        }

        return get(this.apiUrl, {
            path: '/txs',
            query: {
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
    fetchInboundTransactions(address, params = { limit: 30 }) {
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
    searchTransactions(query) {
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
    broadcastTx(tx, mode = 'sync') {
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
    async sendWithAccount({ from, ...params }) {
        if (!from) {
            throw new Error('from object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(from.getAddress());
        from.updateInfo(value);

        return this.send({
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
    send({ from, to, amount, ...txInfo }) {
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
     * Fetch validator sets info
     *
     * @param {number} height
     * @returns {Promise<*>}
     */
    fetchValidatorSets(height) {
        if (!height) {
            throw new Error('height was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/validatorsets/${height}`,
        });
    }

    /**
     * Fetch current state of the staking pool
     *
     * @returns {Promise<*>}
     */
    fetchStakingPool() {
        return get(this.apiUrl, {
            path: '/staking/pool',
        });
    }

    /**
     * Fetch staking module parameters
     *
     * @returns {Promise<*>}
     */
    fetchStakingParameters() {
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
    fetchValidators(status, params = {}) {
        return get(this.apiUrl, {
            path: '/staking/validators',
            query: {
                status,
                ...params,
            },
        });
    }

    /**
     * Fetch the information from a single validator
     *
     * @param {string} validatorAddr Bech32 OperatorAddress of Validator
     * @returns {Promise<*>}
     */
    fetchValidatorDetails(validatorAddr) {
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
    fetchValidatorDelegations(validatorAddr) {
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
    fetchValidatorUnbondingDelegations(validatorAddr) {
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
    fetchDelegatorDelegations(delegatorAddr) {
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
    fetchDelegatorDelegation(delegatorAddr, validatorAddr) {
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
    fetchDelegatorUnbondingDelegations(delegatorAddr) {
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
    fetchDelegatorUnbondingDelegation(delegatorAddr, validatorAddr) {
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
    fetchDelegatorRedelegations(delegatorAddr, validatorSrcAddr, validatorDstAddr) {
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
    async delegateWithAccount({ delegator, ...params }) {
        if (!delegator) {
            throw new Error('delegator object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(delegator.getAddress());
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
    delegate({ delegatorAddr, validatorAddr, amount, ...txInfo }) {
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
    async redelegateWithAccount({ delegator, ...params }) {
        if (!delegator) {
            throw new Error('delegator object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(delegator.getAddress());
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
    redelegate({ delegatorAddr, validatorSrcAddr, validatorDstAddr, amount, ...txInfo }) {
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
    async undelegateWithAccount({ delegator, ...params }) {
        if (!delegator) {
            throw new Error('delegator object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(delegator.getAddress());
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
    undelegate({ delegatorAddr, validatorAddr, amount, ...txInfo }) {
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
     * Edit validator info with account
     *
     * @param {Account} validator
     * @param params {{minSelfDelegation, commission, description, validatorAddr: string}}
     * @returns {*}
     */
    async editValidatorWithAccount({ validator, ...params }) {
        if (!validator) {
            throw new Error('validator object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(validator.getAddress());
        validator.updateInfo(value);

        return this.editValidator({
            ...params,
            validatorAddr: validator.getAddress(),
            privateKey: validator.getPrivateKey(),
            publicKey: validator.getPublicKeyEncoded(),
            accountNumber: validator.getAccountNumber(),
            sequence: validator.getSequence(),
        });
    }


    /**
     * Edit validator info
     *
     * @param {string} validatorAddr
     * @param description
     * @param commission
     * @param minSelfDelegation
     * @param txInfo {{fee: *, gas: number, memo: string, accountNumber: number, sequence: number, privateKey: *, publicKey: string}}
     * @returns {*}
     */
    editValidator({ validatorAddr, description, commission, minSelfDelegation, ...txInfo }) {
        if (!validatorAddr) {
            throw new Error('validatorAddr object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: MsgEditValidator.type,
            validatorAddr,
            description,
            commission,
            minSelfDelegation,
        }, txInfo);
    }

    /**
     * Fetch fee distribution parameters
     *
     * @returns {Promise<*>}
     */
    fetchDistributionParameters() {
        return get(this.apiUrl, {
            path: '/distribution/parameters',
        });
    }

    /**
     * Fetch Community pool parameters
     *
     * @returns {Promise<*>}
     */
    fetchDistributionCommunityPool() {
        return get(this.apiUrl, {
            path: '/distribution/community_pool',
        });
    }


    /**
     * Fetch the total rewards balance from all delegations
     *
     * @param {string} delegatorAddr Bech32 AccAddress of Delegator
     * @returns {Promise<*>}
     */
    fetchDelegatorRewards(delegatorAddr) {
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
    fetchDelegatorReward(delegatorAddr, validatorAddr) {
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
    async withdrawDelegationRewardWithAccount({ delegator, ...params }) {
        if (!delegator) {
            throw new Error('delegator object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(delegator.getAddress());
        delegator.updateInfo(value);

        return this.withdrawDelegationReward({
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
    async withdrawDelegationReward({ delegatorAddr, validatorAddr, ...txInfo }) {
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
    async withdrawDelegationRewardsWithAccount({ delegator, ...params }) {
        if (!delegator) {
            throw new Error('delegator object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(delegator.getAddress());
        delegator.updateInfo(value);

        return this.withDrawDelegationRewards({
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
    async withDrawDelegationRewards({ delegatorAddr, ...txInfo }) {
        if (!delegatorAddr) {
            throw new Error('delegatorAddr object was not set or invalid');
        }

        const tx = await post(this.apiUrl, {
            path: `/distribution/delegators/${delegatorAddr}/rewards`,
            data: {
                ...this.buildBaseReq({
                    chainId: this.chainId,
                    from: delegatorAddr,
                    ...txInfo,
                }),
            },
        });

        if (!tx.value) {
            throw new Error('tx value was not set or invalid');
        }

        return this.buildSignBroadcastTx(tx, txInfo);
    }

    /**
     * Validator distribution information
     *
     * @param {string} validatorAddr Bech32 OperatorAddress of validator
     * @returns {Promise<*>}
     */
    fetchValidatorDistribution(validatorAddr) {
        if (!validatorAddr) {
            throw new Error('validatorAddr was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/distribution/validators/${validatorAddr}`,
        });
    }

    /**
     * Fetch fee distribution outstanding rewards of a single validator
     *
     * @param {string} validatorAddr Bech32 OperatorAddress of validator
     * @returns {Promise<*>}
     */
    fetchValidatorOutstandingRewards(validatorAddr) {
        if (!validatorAddr) {
            throw new Error('validatorAddr was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/distribution/validators/${validatorAddr}/outstanding_rewards`,
        });
    }

    /**
     * Commission and self-delegation rewards of a single validator
     *
     * @param {string} validatorAddr Bech32 OperatorAddress of validator
     * @returns {Promise<*>}
     */
    fetchValidatorRewards(validatorAddr) {
        if (!validatorAddr) {
            throw new Error('validatorAddr was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/distribution/validators/${validatorAddr}/rewards`,
        });
    }

    /**
     * Fetch sign info of given all validators
     */
    fetchSlashingSigningInfos() {
        return get(this.apiUrl, {
            path: '/slashing/signing_infos',
        });
    }

    /**
     * Fetch slashing module parameters
     */
    fetchSlashingParameters() {
        return get(this.apiUrl, {
            path: '/slashing/parameters',
        });
    }

    /**
     * Unjail a jailed validator
     *
     * @param {Account} validator from account
     * @param {string} validatorAddr Bech32 validator address
     * @param params
     */
    async unjailValidatorWithAccount({ validatorAddr, validator, ...params }) {
        if (!validator) {
            throw new Error('validator object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(validator.getAddress());
        validator.updateInfo(value);

        return this.unjailValidator({
            ...params,
            validatorAddr,
            from: validator.getAddress(),
            privateKey: validator.getPrivateKey(),
            publicKey: validator.getPublicKeyEncoded(),
            accountNumber: validator.getAccountNumber(),
            sequence: validator.getSequence(),
        });
    }

    /**
     * Unjail a jailed validator
     *
     * @param {string} validatorAddr Bech32 validator address
     * @param txInfo {{gas: number, memo: string, accountNumber: number, sequence: number, privateKey: *, publicKey: string}}
     */
    unjailValidator({ validatorAddr, ...txInfo }) {
        if (!validatorAddr) {
            throw new Error('validatorAddr object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: MsgUnjail.type,
            validatorAddr,
        }, txInfo);
    }

    /**
     * Fetch the total supply of coins
     *
     * @returns {Promise<*>}
     */
    fetchSupplyTotal() {
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
    fetchSupplyDenom(denom) {
        if (!denom) {
            throw new Error('denom was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/supply/total/${denom}`,
        });
    }

    /**
     * Fetch minting module parameters
     */
    fetchMintParameters() {
        return get(this.apiUrl, {
            path: '/minting/parameters',
        });
    }

    /**
     * Fetch current minting inflation value
     */
    fetchMintInflation() {
        return get(this.apiUrl, {
            path: '/minting/inflation',
        });
    }

    /**
     * Fetch current minting annual provisions value
     */
    fetchMintAnnualProvisions() {
        return get(this.apiUrl, {
            path: '/minting/annual-provisions',
        });
    }

    /**
     * Fetch governance deposit parameters
     */
    fetchGovDepositParameters() {
        return get(this.apiUrl, {
            path: '/gov/parameters/deposit',
        });
    }

    /**
     * Fetch governance tally parameters
     */
    fetchGovTallyingParameters() {
        return get(this.apiUrl, {
            path: '/gov/parameters/tallying',
        });
    }

    /**
     * Fetch governance votin parameters
     */
    fetchGovVotingParameters() {
        return get(this.apiUrl, {
            path: '/gov/parameters/voting',
        });
    }

    /**
     * Fetch gov proposals
     *
     * @returns {Promise<*>}
     */
    fetchGovProposals(params = {}) {
        return get(this.apiUrl, {
            path: '/gov/proposals',
            query: params,
        });
    }

    /**
     * Fetch gov proposal
     *
     * @param {string} proposalId
     * @returns {Promise<*>}
     */
    fetchGovProposal(proposalId) {
        if (!proposalId) {
            throw new Error('id was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/gov/proposals/${proposalId}`,
        });
    }

    /**
     * Fetch proposal proposer
     *
     * @param {string} proposalId
     * @returns {Promise<*>}
     */
    fetchGovProposalProposer(proposalId) {
        if (!proposalId) {
            throw new Error('id not was set or invalid');
        }

        return get(this.apiUrl, {
            path: `/gov/proposals/${proposalId}/proposer`,
        });
    }

    /**
     * Fetch proposal deposits
     *
     * @param {string} proposalId
     * @returns {Promise<*>}
     */
    fetchGovProposalDeposits(proposalId) {
        if (!proposalId) {
            throw new Error('proposalId not was set or invalid');
        }

        return get(this.apiUrl, {
            path: `/gov/proposals/${proposalId}/deposits`,
        });
    }

    /**
     * Fetch proposal deposit of depositor
     *
     * @param {string} proposalId
     * @param {string} depositorAddr Bech32 OperatorAddress of depositor
     * @returns {Promise<*>}
     */
    fetchGovProposalDeposit(proposalId, depositorAddr) {
        if (!proposalId) {
            throw new Error('id was not set or invalid');
        }
        if (!depositorAddr) {
            throw new Error('depositorAddr was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/gov/proposals/${proposalId}/deposits/${depositorAddr}`,
        });
    }

    /**
     * Fetch proposal votes
     *
     * @param {string} proposalId
     * @returns {Promise<*>}
     */
    fetchGovProposalVotes(proposalId) {
        if (!proposalId) {
            throw new Error('id not was set or invalid');
        }

        return get(this.apiUrl, {
            path: `/gov/proposals/${proposalId}/votes`,
        });
    }

    /**
     * Fetch proposal vote of voter
     *
     * @param {string} proposalId
     * @param {string} voterAddr Bech32 OperatorAddress of depositor
     * @returns {Promise<*>}
     */
    fetchGovProposalVote(proposalId, voterAddr) {
        if (!proposalId) {
            throw new Error('proposalId not was set or invalid');
        }

        return get(this.apiUrl, {
            path: `/gov/proposals/${proposalId}/votes/${voterAddr}`,
        });
    }

    /**
     * Fetch a proposal's tally result at the current time
     *
     * @param {string} proposalId
     * @returns {Promise<*>}
     */
    fetchGovProposalTally(proposalId) {
        if (!proposalId) {
            throw new Error('proposalId not was set or invalid');
        }

        return get(this.apiUrl, {
            path: `/gov/proposals/${proposalId}/tally`,
        });
    }

    /**
     * Submit a proposal with account.
     *
     * @param {Account} proposer
     * @param params {{title: string, description:string, proposalType: string, changes, amount: number, denom: string, gas: number, memo: string, accountNumber: number, sequence: number, privateKey: *, publicKey: string}}
     * @returns {Promise<*>}
     */
    async submitProposalWithAccount({ proposer, ...params }) {
        if (!proposer) {
            throw new Error('proposer object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(proposer.getAddress());
        proposer.updateInfo(value);

        return this.submitProposal({
            ...params,
            proposerAddr: proposer.getAddress(),
            privateKey: proposer.getPrivateKey(),
            publicKey: proposer.getPublicKeyEncoded(),
            accountNumber: proposer.getAccountNumber(),
            sequence: proposer.getSequence(),
        });
    }

    /**
     * Submit a proposal.
     *
     * @param {string} proposerAddr
     * @param {string} title
     * @param {string} description
     * @param {string} proposalType
     * @param changes
     * @param {number} amount
     * @param {string} denom
     * @param txInfo {{gas: number, memo: string, accountNumber: number, sequence: number, privateKey: *, publicKey: string}}
     * @returns {Promise<*>}
     */
    async submitProposal({
                             proposerAddr,
                             title,
                             description,
                             proposalType,
                             denom = DEFAULT_DENOM,
                             amount = 0,
                             changes = undefined,
                             ...txInfo
                         }) {
        if (!proposerAddr) {
            throw new Error('proposerAddr object was not set or invalid');
        }

        const tx = await post(this.apiUrl, {
            path: proposalType === 'param_change' ? '/gov/proposals/param_change' : '/gov/proposals',
            data: {
                ...this.buildBaseReq({
                    chainId: this.chainId,
                    from: proposerAddr,
                    ...txInfo,
                }),
                title,
                description,
                proposer: proposerAddr,
                proposal_type: proposalType,
                changes: proposalType === 'param_change' ? changes : undefined,
                initial_deposit: [
                    {
                        amount: String(amount),
                        denom,
                    },
                ],
            },
        });

        if (!tx.value) {
            throw new Error('tx value was not set or invalid');
        }

        return this.buildSignBroadcastTx(tx, txInfo);
    }

    /**
     * Deposit tokens to a proposal with account
     *
     * @param {Account} depositor
     * @param params {{proposalId: string, amount: number, gas: number, memo: string, accountNumber: number, sequence: number, privateKey: *, publicKey: string}}
     * @returns {Promise<*>}
     */
    async depositToProposalWithAccount({ depositor, ...params }) {
        if (!depositor) {
            throw new Error('depositor object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(depositor.getAddress());
        depositor.updateInfo(value);

        return this.depositToProposal({
            ...params,
            depositorAddr: depositor.getAddress(),
            privateKey: depositor.getPrivateKey(),
            publicKey: depositor.getPublicKeyEncoded(),
            accountNumber: depositor.getAccountNumber(),
            sequence: depositor.getSequence(),
        });
    }

    /**
     * Deposit tokens to a proposal
     *
     * @param {string} depositorAddr
     * @param {string} proposalId
     * @param {number} amount
     * @param txInfo {{gas: number, memo: string, accountNumber: number, sequence: number, privateKey: *, publicKey: string}}
     * @returns {Promise<*>}
     */
    depositToProposal({
                          depositorAddr,
                          proposalId,
                          amount = 0,
                          ...txInfo
                      }) {
        if (!proposalId) {
            throw new Error('proposalId object was not set or invalid');
        }
        if (!depositorAddr) {
            throw new Error('depositorAddr object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: MsgDeposit.type,
            proposalId,
            depositorAddr,
            amount,
            denom: DEFAULT_DENOM,
        }, txInfo);
    }

    /**
     * Vote a proposal with account
     *
     * @param {Account} voter
     * @param params {{proposalId: string, option: string, gas: number, memo: string, accountNumber: number, sequence: number, privateKey: *, publicKey: string}}
     * @returns {Promise<*>}
     */
    async voteProposalWithAccount({ voter, ...params }) {
        if (!voter) {
            throw new Error('voter object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(voter.getAddress());
        voter.updateInfo(value);

        return this.voteProposal({
            ...params,
            voterAddr: voter.getAddress(),
            privateKey: voter.getPrivateKey(),
            publicKey: voter.getPublicKeyEncoded(),
            accountNumber: voter.getAccountNumber(),
            sequence: voter.getSequence(),
        });
    }

    /**
     * Vote a proposal
     *
     * @param {string} voterAddr
     * @param {string} proposalId
     * @param {string} option
     * @param txInfo {{gas: number, memo: string, accountNumber: number, sequence: number, privateKey: *, publicKey: string}}
     * @returns {Promise<*>}
     */
    voteProposal({
                     voterAddr,
                     proposalId,
                     option = 'No',
                     ...txInfo
                 }) {
        if (!voterAddr) {
            throw new Error('voterAddr object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: MsgVote.type,
            proposalId,
            voterAddr,
            option,
        }, txInfo);
    }

    /**
     * Create issue with account [ERC20]
     *
     * @param {Account} issuer
     * @param params {{
     *              issuerAddr: string,
     *              denom: string,
     *              symbol: string,
     *              totalSupply: number,
     *              decimals: number,
     *              description: string,
     *              burnOwnerDisabled: boolean,
     *              burnHolderDisabled: boolean,
     *              burnFromDisabled: boolean,
     *              mintDisabled: boolean,
     *              freezeDisabled: boolean,
     *              fee: *,
     *              gas: number,
     *              memo: string,
     *              accountNumber: number,
     *              sequence: number,
     *              privateKey: *,
     *              publicKey: string
     *       }}
     * @returns {Promise<*>}
     */
    async issueCreateWithAccount({ issuer, ...params }) {
        if (!issuer) {
            throw new Error('issuer object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(issuer.getAddress());
        issuer.updateInfo(value);

        return this.issueCreate({
            ...params,
            issuerAddr: issuer.getAddress(),
            privateKey: issuer.getPrivateKey(),
            publicKey: issuer.getPublicKeyEncoded(),
            accountNumber: issuer.getAccountNumber(),
            sequence: issuer.getSequence(),
        });
    }

    /**
     * Issue create [ERC20]
     *
     * @param {string} issuerAddr
     * @param {string} denom
     * @param {string} symbol
     * @param {number} totalSupply
     * @param {number} decimals
     * @param {string} description
     * @param {boolean} burnOwnerDisabled
     * @param {boolean} burnHolderDisabled
     * @param {boolean} burnFromDisabled
     * @param {boolean} mintDisabled
     * @param {boolean} freezeDisabled
     * @param txInfo {{
     *              fee: *,
     *              gas: number,
     *              memo: string,
     *              accountNumber: number,
     *              sequence: number,
     *              privateKey: *,
     *              publicKey: string
     *        }}
     * @returns {Promise<*>}
     */
    async issueCreate({
                          issuerAddr,
                          denom,
                          symbol,
                          totalSupply,
                          decimals,
                          description,
                          burnOwnerDisabled,
                          burnHolderDisabled,
                          burnFromDisabled,
                          mintDisabled,
                          freezeDisabled,
                          ...txInfo
                      }) {
        if (!issuerAddr) {
            throw new Error('issuerAddr object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: MsgIssueCreate.type,
            issuerAddr,
            denom,
            symbol,
            totalSupply,
            decimals,
            description,
            burnOwnerDisabled,
            burnHolderDisabled,
            burnFromDisabled,
            mintDisabled,
            freezeDisabled,
        }, txInfo);
    }

    /**
     * Fetch all issues [ERC20]
     *
     * @returns {Promise<*>}
     */
    fetchIssuesAll() {
        return get(this.apiUrl, {
            path: '/issue/issues/all',
        });
    }

    /**
     * Fetch all issues [ERC20]
     *
     * @param params {{owner, limit}}
     * @returns {Promise<*>}
     */
    fetchIssues(params) {
        return get(this.apiUrl, {
            path: '/issue/issues',
            query: params,
        });
    }

    /**
     * Fetch issue by denom [ERC20]
     *
     * @param {string} denom
     * @returns {Promise<*>}
     */
    fetchIssue(denom) {
        if (!denom) {
            throw new Error('denom was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/issue/issue/${denom}`,
        });
    }

    /**
     * Approve amount for spender [ERC20]
     *
     * @param {Account} owner
     * @param params {{
     *              spenderAddr: string,
     *              amount: Array,
     *              gas: number,
     *              memo: string,
     *              accountNumber: number,
     *              sequence: number,
     *              privateKey: *,
     *              publicKey: string
     *       }}
     * @returns {Promise<*>}
     */
    async approveWithAccount({ owner, ...params }) {
        if (!owner) {
            throw new Error('owner object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(owner.getAddress());
        owner.updateInfo(value);

        return this.approve({
            ...params,
            ownerAddr: owner.getAddress(),
            privateKey: owner.getPrivateKey(),
            publicKey: owner.getPublicKeyEncoded(),
            accountNumber: owner.getAccountNumber(),
            sequence: owner.getSequence(),
        });
    }

    /**
     * Approve amount for spender [ERC20]
     *
     * @param {string} ownerAddr
     * @param {string} spenderAddr
     * @param {Array} amount
     * @param txInfo {{
     *              gas: number,
     *              memo: string,
     *              accountNumber: number,
     *              sequence: number,
     *              privateKey: *,
     *              publicKey: string
     *        }}
     * @returns {Promise<*>}
     */
    async approve({
                      ownerAddr,
                      spenderAddr,
                      amount,
                      ...txInfo
                  }) {
        if (!ownerAddr) {
            throw new Error('ownerAddr object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: MsgIssueApprove.type,
            ownerAddr,
            spenderAddr,
            amount,
        }, txInfo);
    }

    /**
     * Fetch allowance [ERC20]
     *
     * @param {string} ownerAddr
     * @param {string} spenderAddr
     * @param {string} denom
     * @returns {Promise<*>}
     */
    fetchAllowance(ownerAddr, spenderAddr, denom) {
        if (!ownerAddr) {
            throw new Error('ownerAddr was not set or invalid');
        }
        if (!spenderAddr) {
            throw new Error('spenderAddr was not set or invalid');
        }
        if (!denom) {
            throw new Error('denom was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/issue/allowance/${ownerAddr}/${spenderAddr}/${denom}`,
        });
    }

    /**
     * Fetch allowances [ERC20]
     *
     * @param {string} ownerAddr
     * @param {string} denom
     * @returns {Promise<*>}
     */
    fetchAllowances(ownerAddr, denom) {
        if (!ownerAddr) {
            throw new Error('ownerAddr was not set or invalid');
        }
        if (!denom) {
            throw new Error('denom was not set or invalid');
        }

        return get(this.apiUrl, {
            path: `/issue/allowances/${ownerAddr}/${denom}`,
        });
    }

    /**
     * Transfer tokens with account [ERC20]
     *
     * @param {Account} from
     * @param params {{
     *              toAddr: string,
     *              amount: Array,
     *              gas: number,
     *              memo: string,
     *              accountNumber: number,
     *              sequence: number,
     *              privateKey: *,
     *              publicKey: string
     *       }}
     * @returns {Promise<*>}
     */
    async transferWithAccount({ from, ...params }) {
        if (!from) {
            throw new Error('from object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(from.getAddress());
        from.updateInfo(value);

        return this.transfer({
            ...params,
            fromAddr: from.getAddress(),
            privateKey: from.getPrivateKey(),
            publicKey: from.getPublicKeyEncoded(),
            accountNumber: from.getAccountNumber(),
            sequence: from.getSequence(),
        });
    }

    /**
     * Transfer tokens [ERC20]
     *
     * @param {string} fromAddr
     * @param {string} toAddr
     * @param {Array} amount
     * @param txInfo {{
     *              gas: number,
     *              memo: string,
     *              accountNumber: number,
     *              sequence: number,
     *              privateKey: *,
     *              publicKey: string
     *        }}
     * @returns {Promise<*>}
     */
    async transfer({
                       fromAddr,
                       toAddr,
                       amount,
                       ...txInfo
                   }) {
        if (!fromAddr) {
            throw new Error('fromAddr object was not set or invalid');
        }
        if (!toAddr) {
            throw new Error('toAddr object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: MsgIssueTransfer.type,
            fromAddr,
            toAddr,
            amount,
        }, txInfo);
    }

    /**
     * TransferFrom tokens with account [ERC20]
     *
     * @param {Account} spender
     * @param params {{
     *              fromAddr: string,
     *              toAddr: string,
     *              amount: Array,
     *              gas: number,
     *              memo: string,
     *              accountNumber: number,
     *              sequence: number,
     *              privateKey: *,
     *              publicKey: string
     *       }}
     * @returns {Promise<*>}
     */
    async transferFromWithAccount({ spender, ...params }) {
        if (!spender) {
            throw new Error('spender object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(spender.getAddress());
        spender.updateInfo(value);

        return this.transferFrom({
            ...params,
            spenderAddr: spender.getAddress(),
            privateKey: spender.getPrivateKey(),
            publicKey: spender.getPublicKeyEncoded(),
            accountNumber: spender.getAccountNumber(),
            sequence: spender.getSequence(),
        });
    }

    /**
     * TransferFrom tokens [ERC20]
     *
     * @param {string} spenderAddr
     * @param {string} fromAddr
     * @param {string} toAddr
     * @param {Array} amount
     * @param txInfo {{
     *              gas: number,
     *              memo: string,
     *              accountNumber: number,
     *              sequence: number,
     *              privateKey: *,
     *              publicKey: string
     *        }}
     * @returns {Promise<*>}
     */
    async transferFrom({
                           spenderAddr,
                           fromAddr,
                           toAddr,
                           amount,
                           ...txInfo
                       }) {
        if (!spenderAddr) {
            throw new Error('spenderAddr object was not set or invalid');
        }
        if (!fromAddr) {
            throw new Error('fromAddr object was not set or invalid');
        }
        if (!toAddr) {
            throw new Error('toAddr object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: MsgIssueTransferFrom.type,
            spenderAddr,
            fromAddr,
            toAddr,
            amount,
        }, txInfo);
    }

    /**
     * Increases the allowance granted to `spender` by the caller. [ERC20]
     *
     * @param {Account} owner
     * @param params {{
     *              spenderAddr: string,
     *              amount: Array,
     *              gas: number,
     *              memo: string,
     *              accountNumber: number,
     *              sequence: number,
     *              privateKey: *,
     *              publicKey: string
     *       }}
     * @returns {Promise<*>}
     */
    async increaseAllowanceWithAccount({ owner, ...params }) {
        if (!owner) {
            throw new Error('owner object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(owner.getAddress());
        owner.updateInfo(value);

        return this.increaseAllowance({
            ...params,
            ownerAddr: owner.getAddress(),
            privateKey: owner.getPrivateKey(),
            publicKey: owner.getPublicKeyEncoded(),
            accountNumber: owner.getAccountNumber(),
            sequence: owner.getSequence(),
        });
    }

    /**
     * Increases the allowance granted to `spender` by the caller. [ERC20]
     *
     * @param {string} ownerAddr
     * @param {string} spenderAddr
     * @param {Array} amount
     * @param txInfo {{
     *              gas: number,
     *              memo: string,
     *              accountNumber: number,
     *              sequence: number,
     *              privateKey: *,
     *              publicKey: string
     *        }}
     * @returns {Promise<*>}
     */
    increaseAllowance({
                          ownerAddr,
                          spenderAddr,
                          amount,
                          ...txInfo
                      }) {
        if (!spenderAddr) {
            throw new Error('spenderAddr object was not set or invalid');
        }

        if (!ownerAddr) {
            throw new Error('ownerAddr object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: MsgIssueIncreaseAllowance.type,
            ownerAddr,
            spenderAddr,
            amount,
        }, txInfo);
    }

    /**
     * Decreases the allowance granted to `spender` by the caller. [ERC20]
     *
     * @param {Account} owner
     * @param params {{
     *              spenderAddr: string,
     *              amount: Array,
     *              gas: number,
     *              memo: string,
     *              accountNumber: number,
     *              sequence: number,
     *              privateKey: *,
     *              publicKey: string
     *       }}
     * @returns {Promise<*>}
     */
    async decreaseAllowanceWithAccount({ owner, ...params }) {
        if (!owner) {
            throw new Error('owner object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(owner.getAddress());
        owner.updateInfo(value);

        return this.decreaseAllowance({
            ...params,
            ownerAddr: owner.getAddress(),
            privateKey: owner.getPrivateKey(),
            publicKey: owner.getPublicKeyEncoded(),
            accountNumber: owner.getAccountNumber(),
            sequence: owner.getSequence(),
        });
    }

    /**
     * Decreases the allowance granted to `spender` by the caller. [ERC20]
     *
     * @param {string} ownerAddr
     * @param {string} spenderAddr
     * @param {Array} amount
     * @param txInfo {{
     *              gas: number,
     *              memo: string,
     *              accountNumber: number,
     *              sequence: number,
     *              privateKey: *,
     *              publicKey: string
     *        }}
     * @returns {Promise<*>}
     */
    async decreaseAllowance({
                                ownerAddr,
                                spenderAddr,
                                amount,
                                ...txInfo
                            }) {
        if (!ownerAddr) {
            throw new Error('ownerAddr object was not set or invalid');
        }

        if (!spenderAddr) {
            throw new Error('spenderAddr object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: MsgIssueDecreaseAllowance.type,
            ownerAddr,
            spenderAddr,
            amount,
        }, txInfo);
    }

    /**
     * Mint tokens to account. [ERC20]
     *
     * @param {Account} minter
     * @param params {{
     *              toAddr: string,
     *              amount: Array,
     *              gas: number,
     *              memo: string,
     *              accountNumber: number,
     *              sequence: number,
     *              privateKey: *,
     *              publicKey: string
     *       }}
     * @returns {Promise<*>}
     */
    async mintWithAccount({ minter, ...params }) {
        if (!minter) {
            throw new Error('minter object was not set or invalid');
        }

        const { result: { value } } = await this.fetchAccount(minter.getAddress());
        minter.updateInfo(value);

        return this.mint({
            ...params,
            minterAddr: minter.getAddress(),
            privateKey: minter.getPrivateKey(),
            publicKey: minter.getPublicKeyEncoded(),
            accountNumber: minter.getAccountNumber(),
            sequence: minter.getSequence(),
        });
    }

    /**
     * Mint tokens to account. [ERC20]
     *
     * @param {string} minterAddr
     * @param {string} toAddr
     * @param {Array} amount
     * @param txInfo {{
     *              gas: number,
     *              memo: string,
     *              accountNumber: number,
     *              sequence: number,
     *              privateKey: *,
     *              publicKey: string
     *        }}
     * @returns {Promise<*>}
     */
    async mint({
                   minterAddr,
                   toAddr,
                   amount,
                   ...txInfo
               }) {
        if (!minterAddr) {
            throw new Error('minterAddr object was not set or invalid');
        }

        if (!toAddr) {
            throw new Error('toAddr object was not set or invalid');
        }

        return this.buildSignBroadcast({
            type: MsgIssueMint.type,
            minterAddr,
            toAddr,
            amount,
        }, txInfo);
    }

    // --------------- ws ------------------

    /**
     * Subscribe for new block event
     *
     * @param {function} handler
     */
    subscribeNewBlock(handler) {
        this.socket.subscribe('tm.event = \'NewBlock\'', handler);
    }

    /**
     * Subscribe for new tx event
     *
     * @param {function} handler
     */
    subscribeNewTx(handler) {
        this.socket.subscribe('tm.event = \'Tx\'', handler);
    }

    /**
     * Subscribe for txs where addr received funds
     *
     * @param {function} handler
     * @param {string} addr
     */
    subscribeNewTxToRecipient(handler, addr) {
        this.socket.subscribe(`tm.event = 'Tx' AND transfer.recipient = '${addr}'`, handler);
    }

    /**
     * Subscribe for txs where addr transferred funds
     *
     * @param {function} handler
     * @param {string} addr
     */
    subscribeNewTxFromRecipient(handler, addr) {
        this.socket.subscribe(`tm.event = 'Tx' AND transfer.sender = '${addr}'`, handler);
    }

    /**
     * Connect to node's websocket
     *
     */
    connect() {
        this.socket.connect();
    }
}

function network(config) {
    return new Chain(config);
}

export default {
    network,
};

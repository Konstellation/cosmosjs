# CosmosJS - Cosmos JavaScript Library 

Supports CosmosSDK v0.37.+

*:star: Developed / Developing by [Konstellation](https://github.com/konstellation/) on [CosmosJS](https://github.com/cosmostation/cosmosjs/)*

A JavaSript Open Source Library for [Konstellation Network](https://konstellation.tech/)

This library supports cosmos address generation and verification. It enables you to create an offline signature functions of different types of transaction messages. It will eventually support all the other blockchains that are based on Tendermint in the future, such as IOV and others.

[![MIT](https://img.shields.io/apm/l/vim-mode.svg)](https://github.com/konstellation/cosmosjs/blob/master/LICENSE)
[![NPM](https://img.shields.io/npm/v/@konstellation/cosmosjs.svg)](https://www.npmjs.com/package/@konstellation/cosmosjs)

## Installation

In order to fully use this library, you need to run a local or remote full node and set up its rest server, which acts as an intermediary between the front-end and the full-node

### NPM

```bash
npm install @konstellation/cosmosjs
```

### Yarn

```bash
yarn add @konstellation/cosmosjs
```

### Browser Distribution

CosmosJS supports browserify.

## Import 

#### Vue
```js
import sdk from '@konstellation/cosmosjs';
```

#### NodeJS (WIP)

```js
const sdk = require("@konstellation/cosmosjs");
```

#### Browser (WIP)

```html
<script src='js/cosmosjs-bundle.js'></script>
```

## Usage

### Init network
```js
const chain = sdk({
    apiUrl: 'http://localhost:1317',
    nodeUrl: 'http://localhost:26657',
    chainId: 'darchub',
});
```

### Generate Cosmos account
```js
const account = chain.generateAccount();
```

### Import account from keystore or menmonic
```js
const account = chain.importAccount({keystore, pass});
```
or
```js
const account = chain.importAccount({mnemonic});
```

### Recover Cosmos account from mnemonic
```js
const mnemonic = "...";
const account = chain.recoverAccount(mnemonic);
```

### Import Cosmos account from keystore
```js
const account = chain.importAccountFromV3KeyStore(key, pass);
```

### Export Cosmos account to keystore
```js
const ks = chain.exportAccountToV3KeyStore(account, pass);
```

### Get address
```js
const address = account.getAddress();
```

### Fetch node info
```js
const { node_info } = await chain.fetchNodeInfo();
```

### Fetch blockchain info
```js
const { result } = await chain.fetchBlockchainInfo({
    minHeight,
    maxHeight,
    random: new Date().getTime(),
});
```

### Fetch account info by address
```js
const {result: {value}} = await chain.fetchAccount(address);
account.updateInfo(value);
```

### Fetch balance of account by address
```js
const balance = await chain.fetchAccountBalance(address);
```

### Transfer DARC to destination address. 
#### - Raw method

##### Build message
Make sure to input proper type, account number, and sequence of the cosmos account to generate StdSignMsg. You can get those account information on blockchain 
```js
const msg = chain.buildMsg({
    type: MsgSend.type,
    from: account.getAddress(),
    to: "...",
    amount: {amount, denom},	
});
```

##### Build transaction
```js
const signMsg = chain.buildSignMsg(msg, {
    fee: {amount, denom},
    gas: 200000,
    memo: "",
    accountNumber: account.getAccountNumber(),
    sequence: account.getSequence()
});
```

##### Sign transaction 
```js
const stdTx = chain.signWithAccount(signMsg, account);
```
or
```js
const stdTx = chain.sign(signMsg, account.getPrivateKey(), account.getPublicKey());
```

### Broadcast transaction
```js
const broadcastInfo = await chain.broadcastTx(stdTx, 'sync');
```

##### All in one  
```js
const broadcastInfo = await chain.buildSignBroadcast({
    type: MsgSend.type,
    from: account.getAddress(),
    to: '...',
    amount: {amount, denom},
}, {
    gas,
    memo,
    fee,
    accountNumber: account.getAccountNumber(),
    sequence: account.getSequence(),
    privateKey: account.getPrivateKey(),
    publicKey: account.getPublicKey(),
})
```

#### - Transfer method
```js
const res = await chain.transfer({
    from: account.getAddress(),
    accountNumber: account.getAccountNumber(),
    sequence: account.getSequence(),
    privateKey: account.getPrivateKey(),
    publicKey: account.getPublicKey(),
    to: address,
    amount: {amount, denom},
    memo,
    fee: {amount, denom},
    gas,
});
```

#### - TransferFromAccount method
```js
const res = await chain.transferWithAccount({
    from: account,
    to: address,
    amount: {amount, denom},
    memo,
    fee: {amount, denom},
    gas
});
```

### Fetch total transactions count
```js
const txsInfo = await chain.fetchTotalTransactionsCount();
```

### Fetch all transactions
```js
const txsInfo = await chain.fetchAllTransactions();
```

### Fetch transactions where the address is a recipient
```js
const txsInfo = await chain.fetchInboundTransactions(address, 100);
```

### Fetch transaction where the address is a sender
```js
const txsInfo = await chain.fetchOutboundTransactions(address, 100);
```

### Fetch a transaction by hash in a committed block
```js
const txInfo = await chain.fetchTransaction('FB2FCCCCA94B18E19C9D1A4DDA0DDF97E18E3A385C94A37AA95695E65F7364D5');
```

### Search transactions 
Genesis transactions are returned if the height parameter is set to zero, otherwise the transactions are searched for by events
```js
const txs = await chain.searchTransactions({height: 0});
```

### Delegate tokens to the validator
```js
const res = await chain.delegateWithAccount({
    delegator,
    validatorAddr,
    amount: {amount: denom},
})
```

### Redelegate tokens to the new validator
```js
const res = await chain.redelegateWithAccount({
    delegator,
    validatorDstAddr,
    validatorSrcAddr,
    amount: {amount: denom},
})
```

### Undelegate tokens from the validator
```js
const res = await chain.undelegateWithAccount({
    delegator,
    validatorAddr,
    amount: {amount: denom},
})
```

### Withdraw delegation rewards from the validator
```js
const res = await chain.withdrawDelegationRewardWithAccount({
    delegator,
    validatorAddr,
})
```

### Withdraw all delegation rewards from all delegations
```js
const res = await chain.withdrawDelegationRewardsWithAccount({
    delegator,
})
```

### Unjail validator
```js
const res = await chain.unjailValidatorWithAccount({
    validator,
})
```

### Perform custom request
```js
const node_info = await chain.request('/node_info');
const req = await chain.request('/txs', {
    path: '/FB2FCCCCA94B18E19C9D1A4DDA0DDF97E18E3A385C94A37AA95695E65F7364D5'
});
```

#### This package also supports all available functions of LCD REST-SERVER 

#### Supporting Message Types (Updating...)

- cosmos-sdk/MsgSend
```js
const stdSignMsg = chain.buildMsg({
    type: MsgSend.type,
    from: address,
    to: "...",
    amount: {amount, denom},
});
```
- cosmos-sdk/MsgDelegate
```js
const stdSignMsg = chain.buildMsg({
    type: MsgDelegate.type,
    delegatorAddr,
    validatorAddr,
    amount: {amount, denom},
});
```
- cosmos-sdk/MsgBeginRedelegate
```js
const stdSignMsg = chain.buildMsg({
    type: MsgBeginRedelegate.type,
    delegatorAddr,
    validatorDstAddr,
    validatorSrcAddr,
    amount: {amount, denom},
});
```
- cosmos-sdk/MsgUndelegate
```js
const stdSignMsg = chain.buildMsg({
    type: MsgUndelegate.type,
    amount: {amount, denom},
    delegatorAddr,
    validatorAddr,
});
```
- cosmos-sdk/MsgWithdrawDelegationReward
```js
const stdSignMsg = chain.buildMsg({
    type: MsgWithdrawDelegationReward.type,
    delegatorAddr,
    validatorAddr,
});
```
- cosmos-sdk/MsgUnjail
```js
const stdSignMsg = chain.buildMsg({
    type: MsgUnjail.type,
    validatorAddr,
});
```
- cosmos-sdk/MsgSubmitProposal
```js
const stdSignMsg = chain.buildMsg({
    type: MsgSubmitProposal.type,
    proposal_type: 'TextProposal',
    initialDeposit: {amount, denom},
    description,
    proposer,
    title,
});
```
- cosmos-sdk/MsgDeposit
```js
const stdSignMsg = chain.buildMsg({
    type: MsgDeposit.type,
    proposalId,
    depositorAddr,
    amount: {amount, denom},
});
```
- cosmos-sdk/MsgVote
```js
const stdSignMsg = chain.buildMsg({
    type: MsgVote.type,
    proposalId,
    voterAddr,
    option,
});
```

## Documentation

This library is simple and easy to use. We don't have any formal documentation yet other than examples. Ask for help if our examples aren't enough to guide you

## Contribution

- Contributions, suggestions, improvements, and feature requests are always welcome

When opening a PR with a minor fix, make sure to add #trivial to the title/description of said PR.


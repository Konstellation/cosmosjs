# CosmosJS - Cosmos JavaScript Library 

*:star: Developed / Developing by [Konstellation](https://github.com/konstellation/) on [CosmosJS](https://github.com/cosmostation/cosmosjs/)*

A JavasSript Open Source Library for [Konstellation Network](https://konstellation.tech/)

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

#### NodeJS

```js
const sdk = require("@konstellation/cosmosjs");
```

#### Browser

```html
<script src='js/cosmosjs-bundle.js'></script>
```

## Usage
Konstellation offers LCD url(https://lcd-do-not-abuse.cosmostation.io).
* API Rate Limiting: 10 requests per second

### Init network
```js
const chain = sdk.network({
    url: "http://127.0.0.1:1317",
});
```

### Fetch node info
```js
const nodeInfo = chain.fetchNodeInfo()
```

### Config chain to perform transactions
```js
chain.updateConfig(nodeInfo);
```

### Generate Cosmos account
```js
let account = chain.generateAccount();
```

### Recover Cosmos account from mnemonic
```js
const mnemonic = "...";
const account = chain.recoverAccount(mnemonic);
```

### Get address
```js
const address = account.getAddress();
```

### Fetch balance of account by address
```js
const balance = await chain.fetchBalance(address);
```

### Fetch account info by address
```js
const {result: {value}} = await chain.fetchAccount(address);
account.updateInfo(value);
```

### Transfer DARC to destination address. 
#### - Raw method

##### Build message
Make sure to input proper type, account number, and sequence of the cosmos account to generate StdSignMsg. You can get those account information on blockchain 
```js
const msg = chain.buildMsg({
    type: "cosmos-sdk/MsgSend",
    from_address: account.getAddress(),
    to_address: "...",
    denom: "darc",
    amount: 100,	
});
```

##### Build transaction
```js
const signMsg = chain.buildSignMsg(msg, {
    chainId: 'darchub',
    feeDenom: "darc",
    fee: 5000,
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

##### Broadcast transaction 
```js
const broadcastInfo = await chain.broadcastTx(stdTx, 'sync');
```

#### - Transfer method
```js
const res = await chain.transfer({
    from: account.getAddress(),
    accountNumber: account.getAccountNumber(),
    sequence: account.getSequence(),
    privateKey: account.getPrivateKey(),
    publicKey: account.getPublicKey(),
    to: "...",
    amount: 300,
});
```

#### - TransferFromAccount method
```js
const res = await chain.transferFromAccount({
    from: account,
    to: '...',
    amount: 200
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

### Fetch the total supply of coins
```js
const coinsInfo = await chain.fetchTotalSupply();
```

### Fetch the supply of a single denom
```js
const coinsInfo = await chain.fetchSupplyDenom('darc');
```

### Perform custom request
```js
const node_info = await chain.request('/node_info');
const req = await chain.request('/txs', {
    path: '/FB2FCCCCA94B18E19C9D1A4DDA0DDF97E18E3A385C94A37AA95695E65F7364D5'
});
```


                // console.log(await chain.fetchSupplyTotal());
                // console.log(await chain.fetchSupplyDenom('adarc'));
                // console.log(await chain.fetchDistributionCommunityPool());
                // console.log(await chain.fetchDistributionParameters());
                // console.log(await chain.fetchStakingPool());
                // console.log(await chain.fetchStakingParameters());
                // console.log(await chain.fetchSlashingSigningInfos());
                // console.log(await chain.fetchSlashingParameters());
                // console.log(await chain.fetchGovDepositParameters());
                // console.log(await chain.fetchGovTallyingParameters());
                // console.log(await chain.fetchGovVotingParameters());
                
                
            this.$store.dispatch('gov/fetchDepositParams');
            this.$store.dispatch('gov/fetchProposal', this.$route.params.id);
            this.$store.dispatch('gov/fetchProposalTally', this.$route.params.id);
            this.$store.dispatch('gov/fetchProposalVote', this.$route.params.id);
            this.$store.dispatch('gov/fetchProposalVotes', this.$route.params.id);
            this.$store.dispatch('gov/fetchProposalProposer', this.$route.params.id);
            this.$store.dispatch('gov/fetchProposalDeposit', this.$route.params.id);
            this.$store.dispatch('gov/fetchProposalDeposits', this.$route.params.id);

#### Supporting Message Types (Updating...)

- cosmos-sdk/MsgSend
```js
const stdSignMsg = chain.buildMsg({
    type: "cosmos-sdk/MsgSend",
    from_address: address,
    to_address: "...",
    denom: "darc",
    amount: 5000,
});
```

## Documentation

This library is simple and easy to use. We don't have any formal documentation yet other than examples. Ask for help if our examples aren't enough to guide you

## Contribution

- Contributions, suggestions, improvements, and feature requests are always welcome

When opening a PR with a minor fix, make sure to add #trivial to the title/description of said PR.


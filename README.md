<p align="center">
  <a href="https://www.cosmostation.io" target="_blank" rel="noopener noreferrer"><img width="100" src="https://user-images.githubusercontent.com/20435620/55696624-d7df2e00-59f8-11e9-9126-edf9a40b11a8.png" alt="Cosmostation logo"></a>
</p>
<h1 align="center">
    CosmosJS - Cosmos JavaScript Library 
</h1>

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
const cosmosjs = require("@konstellation/cosmosjs");
```

#### Browser

```js
<script src='js/cosmosjs-bundle.js'></script>
```

## Usage
Konstellation offers LCD url(https://lcd-do-not-abuse.cosmostation.io).
* API Rate Limiting: 10 requests per second

### Init network
```js
    const chain = sdk.network({
        url: lcdUrl,
        chainId: 'darchub',
        bech32MainPrefix: "darc",
        path: "m/44'/118'/0'/0/0"
    });
```

### Generate Cosmos account
```js
    let account = chain.generateAccount();
```

### Recover Cosmos account from mnemonic
```js
    const mnemonic = "...";
    let account = chain.recoverAccount(mnemonic);
```

### Get address
```js
    const address = account.getAddress();
```

### Get balance
```js
    let balance = await chain.fetchBalance(address);
```

### Get account info
```js
    let accountInfo = await chain.fetchAccount(address);
    account = account.updateInfo(accountInfo.result.value);
```

### Transfer DARC to destination address. 
#### - Raw method

##### Build message
Make sure to input proper type, account number, and sequence of the cosmos account to generate StdSignMsg. You can get those account information on blockchain 
```js
     let msg = chain.buildMsg({
            type: "cosmos-sdk/MsgSend",
            from_address: account.getAddress(),
            to_address: "...",
            denom: "darc",
            amount: 100,	
     });
```

##### Build transaction
```js
    let signMsg = chain.buildSignMsg(msg, {
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
or
    const stdTx = chain.sign(signMsg, account.getPrivateKey(), account.getPublicKey());
```

##### Broadcast transaction 
```js
    const broadcastInfo = await chain.broadcastTx(stdTx, 'sync');
```

#### - Transfer method
```js
let res = await chain.transfer({
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
let res = await chain.transferFromAccount({
        from: account,
        to: '...',
        amount: 200
    });
```

### Fetch transactions where address is recipient
```js
    let txsInfo = await chain.fetchInboundTransactions(address, 100);
```

### Fetch transaction where address is sender
```js
    let txsInfo = await chain.fetchOutboundTransactions(address, 100);
```

### Fetch coin info
```js
    let coinsInfo = await chain.fetchTotalCoins();
```

### Fetch custom request
```js
    let node_info = await chain.request({
        method: 'GET',
        uri: '/node_info',
    });
```

#### Supporting Message Types (Updating...)

- cosmos-sdk/MsgSend
```js
let stdSignMsg = chain.buildMsg({
      type: "cosmos-sdk/MsgSend",
      from_address: address,
      to_address: "...",
      denom: "darc",
      amount: 5000,
      feeDenom: "darc",
      fee: 5000,
      gas: 200000,
      memo: "",
      account_number: account_info.result.value.account_number,
      sequence: account_info.result.value.sequence
    });
```
- cosmos-sdk/MsgDelegate
```js
stdSignMsg = cosmos.NewStdMsg({
	type: "cosmos-sdk/MsgDelegate",
	delegator_address: address,
	validator_address: "cosmosvaloper1clpqr4nrk4khgkxj78fcwwh6dl3uw4epsluffn",
	denom: "uatom",
	amount: 1000000,
	feeDenom: "uatom",
	fee: 5000,
	gas: 200000,
	memo: "",
	account_number: account_info.result.value.account_number,
	sequence: account_info.result.value.sequence
});
```
- cosmos-sdk/MsgUndelegate
```js
stdSignMsg = cosmos.NewStdMsg({
	type: "cosmos-sdk/MsgUndelegate",
	delegator_address: address,
	validator_address: "cosmosvaloper1clpqr4nrk4khgkxj78fcwwh6dl3uw4epsluffn",
	denom: "uatom",
	amount: 1000000,
	feeDenom: "uatom",
	fee: 5000,
	gas: 200000,
	memo: "",
	account_number: account_info.result.value.account_number,
	sequence: account_info.result.value.sequence
});
```
- cosmos-sdk/MsgWithdrawDelegationReward
```js
stdSignMsg = cosmos.NewStdMsg({
	type: "cosmos-sdk/MsgWithdrawDelegationReward",
	delegator_address: address,
	validator_address: "cosmosvaloper1clpqr4nrk4khgkxj78fcwwh6dl3uw4epsluffn",
	feeDenom: "uatom",
	fee: 5000,
	gas: 200000,
	memo: "",
	account_number: account_info.result.value.account_number,
	sequence: account_info.result.value.sequence
});
```
- cosmos-sdk/MsgSubmitProposal
```js
stdSignMsg = cosmos.NewStdMsg({
	type: "cosmos-sdk/MsgSubmitProposal",
	title: "Activate the Community Pool",
	description: "Enable governance to spend funds from the community pool. Full proposal: https://ipfs.io/ipfs/QmNsVCsyRmEiep8rTQLxVNdMHm2uiZkmaSHCR6S72Y1sL1",
	initialDepositDenom: "uatom",
	initialDepositAmount: 1000000,
	proposal_type: "Text",
	proposer: address,
	feeDenom: "uatom",
	fee: 5000,
	gas: 200000,
	memo: "",
	account_number: account_info.result.value.account_number,
	sequence: account_info.result.value.sequence
});
```
- cosmos-sdk/MsgDeposit
```js
stdSignMsg = cosmos.NewStdMsg({
	type: "cosmos-sdk/MsgDeposit",
	depositor: address,
	proposal_id: 1,
	denom: "uatom",
	amount: 1000000,
	feeDenom: "uatom",
	fee: 5000,
	gas: 200000,
	memo: "",
	account_number: account_info.result.value.account_number,
	sequence: account_info.result.value.sequence
});
```
- cosmos-sdk/MsgVote
```js
stdSignMsg = cosmos.NewStdMsg({
	type: "cosmos-sdk/MsgVote",
	voter: address,
	proposal_id: 1,
	option: "Yes",	// Yes, No, NowithVeto, Abstain
	feeDenom: "uatom",
	fee: 5000,
	gas: 200000,
	memo: "",
	account_number: account_info.result.value.account_number,
	sequence: account_info.result.value.sequence
});
```
- cosmos-sdk/MsgBeginRedelegate
```js
stdSignMsg = cosmos.NewStdMsg({
	type: "cosmos-sdk/MsgBeginRedelegate",
	delegator_address: address,
	validator_src_address: "cosmosvaloper1clpqr4nrk4khgkxj78fcwwh6dl3uw4epsluffn",
	validator_dst_address: "cosmosvaloper1ec3p6a75mqwkv33zt543n6cnxqwun37rr5xlqv",
	denom: "uatom",
	amount: 1000000,
	feeDenom: "uatom",
	fee: 5000,
	gas: 200000,
	memo: "",
	account_number: data.value.account_number,
	sequence: account_info.result.value.sequence
});
```
- cosmos-sdk/MsgModifyWithdrawAddress
```js
stdSignMsg = cosmos.NewStdMsg({
	type: "cosmos-sdk/MsgModifyWithdrawAddress",
	delegator_address: address,
	withdraw_address: "cosmos133mtfk63fuac5e2npfgcktwufnty2536wedfal",
	feeDenom: "uatom",
	fee: 5000,
	gas: 200000,
	memo: "",
	account_number: account_info.result.value.account_number,
	sequence: account_info.result.value.sequence
});
```

## Documentation

This library is simple and easy to use. We don't have any formal documentation yet other than examples. Ask for help if our examples aren't enough to guide you

## Contribution

- Contributions, suggestions, improvements, and feature requests are always welcome

When opening a PR with a minor fix, make sure to add #trivial to the title/description of said PR.


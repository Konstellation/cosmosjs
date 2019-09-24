const sdk = require("../src");

async function _() {
    const chain = sdk.network({
        url: "http://127.0.0.1:1317",
        chainId: 'darchub',
    });

    const mnemonic = "idle practice stadium maple cake traffic input zoo inherit tip mixture upgrade squirrel photo cabbage result limb consider foam tank sad improve grass wolf";
    let account = chain.recoverAccount(mnemonic);

    const address = account.getAddress();
    const accountInfo = await chain.fetchAccount(address);
    account = account.updateInfo(accountInfo.result.value);
    console.log(account.getAddress());

    // const balanceInfo = await chain.fetchBalance(address);
    // console.log(balanceInfo);

    let txsInfo = await chain.fetchInboundTransactions(address, 100);
    console.log(txsInfo.txs.length);

    txsInfo = await chain.fetchOutboundTransactions(address, 100);
    console.log(txsInfo.txs.length);

    // const txInfo = await chain.fetchTransaction('FB2FCCCCA94B18E19C9D1A4DDA0DDF97E18E3A385C94A37AA95695E65F7364D5');
    // console.log(txInfo);

    // const coinsInfo = await chain.fetchTotalSupply();
    // console.log(coinsInfo);

    // const txs = await chain.searchTransactions({height: 0});
    // console.log(txs);

    // const node_info = await chain.request('/node_info');
    // console.log(node_info);

    // const req = await chain.request('/txs', {
    //     path: '/FB2FCCCCA94B18E19C9D1A4DDA0DDF97E18E3A385C94A37AA95695E65F7364D5'
    // });
    // console.log(req);

    // const coinsInfo = await chain.fetchTotalCoins();
    // console.log(coinsInfo);

    // ---------------- TransferFromAccount method ---------------------------

    const resTransferFromAccount = await chain.transferFromAccount({
        from: account,
        to: 'darc1zq5g5gvm2k7e8nq4ca6lvf3u8a2nzlzg7hul8f',
        amount: 200
    });

    console.log(resTransferFromAccount);

    // ---------------- Transfer method method ---------------------------

    // const resTransfer = await chain.transfer({
    //     from: account.getAddress(),
    //     accountNumber: account.getAccountNumber(),
    //     sequence: account.getSequence(),
    //     privateKey: account.getPrivateKey(),
    //     publicKey: account.getPublicKey(),
    //     to: "darc1zq5g5gvm2k7e8nq4ca6lvf3u8a2nzlzg7hul8f",
    //     amount: 300,
    // });
    //
    // console.log(resTransfer);

    // ---------------- Raw method ---------------------------
    //
    // const msg = chain.buildMsg({
    //     type: "cosmos-sdk/MsgSend",
    //     from_address: account.getAddress(),
    //     to_address: "darc1zq5g5gvm2k7e8nq4ca6lvf3u8a2nzlzg7hul8f",
    //     denom: "darc",
    //     amount: 100,		// 6 decimal places
    // });
    // const signMsg = chain.buildSignMsg(msg, {
    //     chainId: 'darchub',
    //     feeDenom: "darc",
    //     fee: 5000,
    //     gas: 200000,
    //     memo: "",
    //     accountNumber: account.getAccountNumber(),
    //     sequence: account.getSequence()
    // });
    // const stdTx = chain.signWithAccount(signMsg, account);
    // const broadcastInfo = await chain.broadcastTx(stdTx, 'sync');
    // console.log(broadcastInfo);
}

_();

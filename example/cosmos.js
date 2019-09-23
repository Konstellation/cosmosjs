const sdk = require("../src");

async function _() {
    const chain = sdk.network({
        url: "http://127.0.0.1:1317",
        chainId: 'darchub',
        bech32MainPrefix: "darc",
        path: "m/44'/118'/0'/0/0"
    });

    const mnemonic = "idle practice stadium maple cake traffic input zoo inherit tip mixture upgrade squirrel photo cabbage result limb consider foam tank sad improve grass wolf";
    let account = chain.recoverAccount(mnemonic);

    const address = account.getAddress();
    let accountInfo = await chain.getAccounts(address);
    account = account.updateInfo(accountInfo.result.value);
    console.log(account.getAddress());

    // ---------------- TransferFromAccount method ---------------------------

    let resTransferFromAccount = await chain.transferFromAccount({
        from: account,
        to: 'darc1zq5g5gvm2k7e8nq4ca6lvf3u8a2nzlzg7hul8f',
        amount: 200
    });

    console.log(resTransferFromAccount);

    // ---------------- Transfer method method ---------------------------

    // let resTransfer = await chain.transfer({
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
    //
    // // ---------------- Raw method ---------------------------
    //
    // let msg = chain.buildMsg({
    //     type: "cosmos-sdk/MsgSend",
    //     from_address: account.getAddress(),
    //     to_address: "darc1zq5g5gvm2k7e8nq4ca6lvf3u8a2nzlzg7hul8f",
    //     denom: "darc",
    //     amount: 100,		// 6 decimal places
    // });
    // let tx = chain.buildTx(msg, {
    //     chainId: 'darchub',
    //     feeDenom: "darc",
    //     fee: 5000,
    //     gas: 200000,
    //     memo: "",
    //     accountNumber: account.getAccountNumber(),
    //     sequence: account.getSequence()
    // });
    // const signedTx = chain.signWithAccount(tx, account);
    // const broadcastInfo = await chain.broadcastTx(signedTx);
    // console.log(broadcastInfo);
}

_();
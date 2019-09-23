module.exports = class Tx {
    constructor({msg, chainId, accountNumber, sequence, memo, fee, feeDenom, gas, mode}) {
        return {
            "tx": {
                account_number: String(accountNumber),
                chain_id: String(chainId),
                fee: {
                    amount: [
                        {
                            amount: String(fee),
                            denom: String(feeDenom)
                        }
                    ],
                    gas: String(gas)
                },
                memo: String(memo),
                msg,
                sequence: String(sequence),
            },
            mode
        }
    }
};
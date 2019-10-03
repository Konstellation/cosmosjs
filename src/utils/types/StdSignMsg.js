export default class StdSignMsg {
    constructor ({msgs, chainId, accountNumber, sequence, memo, fee, gas}) {
        return {
            chain_id: String(chainId),
            account_number: String(accountNumber),
            sequence: String(sequence),
            fee: {
                amount: [
                    {
                        amount: String(fee.amount),
                        denom: String(fee.denom),
                    },
                ],
                gas: String(gas),
            },
            msgs,
            memo: String(memo),
        };
    }
}

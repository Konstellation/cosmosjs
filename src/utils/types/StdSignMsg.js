export default class StdSignMsg {
    constructor ({
                     msgs,
                     chainId,
                     accountNumber,
                     sequence,
                     memo,
                     fee,
                     feeDenom,
                     gas,
                 }) {
        return {
            chain_id: String(chainId),
            account_number: String(accountNumber),
            sequence: String(sequence),
            fee: {
                amount: [
                    {
                        amount: String(fee),
                        denom: String(feeDenom),
                    },
                ],
                gas: String(gas),
            },
            msgs,
            memo: String(memo),
        };
    }
}

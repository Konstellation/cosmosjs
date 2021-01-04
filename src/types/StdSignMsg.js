export default class StdSignMsg {
    constructor({ msgs, chainId, accountNumber, sequence, memo, fee: { amount, denom }, gas }) {
        const feeArr = amount.length === 0 ? [] : [
            {
                amount: String(amount),
                denom,
            }];
        return {
            chain_id: String(chainId),
            account_number: String(accountNumber),
            sequence: String(sequence),
            fee: {
                amount: feeArr,
                gas: String(gas),
            },
            msgs,
            memo: String(memo),
        };
    }
}

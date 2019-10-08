export default class BaseReq {
    constructor ({from, fee: {amount, denom}, accountNumber, sequence, chainId, gas, memo}) {
        return {
            base_req: {
                chain_id: chainId,
                from,
                memo,
                gas: String(gas),
                account_number: String(accountNumber),
                sequence,
                fees: [
                    {
                        amount: String(amount),
                        denom,
                    },
                ],
            },
        };
    }
}

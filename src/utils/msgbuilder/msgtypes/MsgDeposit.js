const MsgType = require('../MsgType');

const type = 'cosmos-sdk/MsgDeposit';

function builder(input) {
    return {
        account_number: String(input.account_number),
        chain_id: input.chainId,
        fee: {
            amount: [
                {
                    amount: String(input.fee),
                    denom: input.feeDenom
                }
            ],
            gas: String(input.gas)
        },
        memo: input.memo,
        msgs: [
            {
                type: input.type,
                value: {
                    amount: [
                        {
                            amount: String(input.amount),
                            denom: input.amountDenom
                        }
                    ],
                    depositor: input.depositor,
                    proposal_id: String(input.proposal_id)
                }
            }
        ],
        sequence: String(input.sequence)
    }
}

module.exports = new MsgType({
    type,
    builder
});
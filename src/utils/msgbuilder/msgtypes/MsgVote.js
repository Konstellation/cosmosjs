const MsgType = require('../MsgType');

const type = 'cosmos-sdk/MsgVote';

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
                    option: input.option,
                    proposal_id: String(input.proposal_id),
                    voter: input.voter
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
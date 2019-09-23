const MsgType = require('../MsgType');

const type = 'cosmos-sdk/MsgSubmitProposal';

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
                    description: input.description,
                    initial_deposit: [
                        {
                            amount: String(input.initialDepositAmount),
                            denom: input.initialDepositDenom
                        }
                    ],
                    proposal_type: input.proposal_type,
                    proposer: input.proposer,
                    title: input.title
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
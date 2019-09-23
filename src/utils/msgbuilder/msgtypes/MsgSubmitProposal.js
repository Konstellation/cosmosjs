const MsgType = require('../MsgType');

const type = 'cosmos-sdk/MsgSubmitProposal';

function builder({description, initialDepositAmount, initialDepositDenom, proposal_type, proposer, title}) {
    return [
        {
            type,
            value: {
                description,
                initial_deposit: [
                    {
                        amount: String(initialDepositAmount),
                        denom: initialDepositDenom
                    }
                ],
                proposal_type,
                proposer,
                title
            }
        }
    ];
}

module.exports = new MsgType({
    type,
    builder
});
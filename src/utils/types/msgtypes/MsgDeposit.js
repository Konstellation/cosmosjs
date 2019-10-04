const MsgType = require('../Msg');

const type = 'cosmos-sdk/MsgDeposit';

function builder({amount, denom, depositor, proposal_id}) {
    return [
        {
            type,
            value: {
                amount: [
                    {
                        amount: String(amount),
                        denom
                    }
                ],
                depositor: depositor,
                proposal_id: String(proposal_id)
            }
        }
    ];
}

module.exports = new Msg({
    type,
    builder
});

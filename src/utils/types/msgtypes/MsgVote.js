const MsgType = require('../Msg');

const type = 'cosmos-sdk/MsgVote';

function builder({option, proposal_id, voter}) {
    return [
        {
            type,
            value: {
                option,
                proposal_id: String(proposal_id),
                voter
            }
        }
    ];
}

module.exports = new Msg({
    type,
    builder
});

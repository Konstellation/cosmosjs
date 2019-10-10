import Msg from '../Msg';

const type = 'cosmos-sdk/MsgVote';

function builder ({option, proposalId, voterAddr}) {
    return [
        {
            type,
            value: {
                option,
                proposal_id: String(proposalId),
                voter: voterAddr,
            },
        },
    ];
}

export default new Msg({
    type,
    builder,
});

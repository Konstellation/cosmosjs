import Msg from '../Msg';

const type = 'cosmos-sdk/MsgDeposit';

function builder ({amount, denom, depositorAddr, proposalId}) {
    return [
        {
            type,
            value: {
                amount: [
                    {
                        amount: String(amount),
                        denom,
                    },
                ],
                depositor: depositorAddr,
                proposal_id: String(proposalId),
            },
        },
    ];
}

export default new Msg({
    type,
    builder,
});

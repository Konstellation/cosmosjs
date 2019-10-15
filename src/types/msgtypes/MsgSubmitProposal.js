import Msg from '../Msg';

const type = 'cosmos-sdk/MsgSubmitProposal';

function builder ({description, initialDeposit: {amount, denom}, proposal_type, proposer, title}) {
    return [
        {
            type,
            value: {
                description,
                initial_deposit: [
                    {
                        amount: String(amount),
                        denom,
                    },
                ],
                proposal_type,
                proposer,
                title,
            },
        },
    ];
}

export default new Msg({
    type,
    builder,
});

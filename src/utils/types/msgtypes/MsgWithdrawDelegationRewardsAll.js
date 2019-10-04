import Msg from '../Msg';

const type = 'cosmos-sdk/MsgWithdrawDelegationRewardsAll';

function builder ({delegatorAddr}) {
    return [
        {
            type,
            value: {
                delegator_address: delegatorAddr,
            },
        },
    ];
}

export default new Msg({
    type,
    builder,
});

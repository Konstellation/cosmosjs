import MsgType from '../MsgType';

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

export default new MsgType({
    type,
    builder,
});

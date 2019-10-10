import Msg from '../Msg';

const type = 'cosmos-sdk/MsgWithdrawDelegationReward';

function builder ({delegatorAddr, validatorAddr}) {
    return [
        {
            type,
            value: {
                delegator_address: delegatorAddr,
                validator_address: validatorAddr,
            },
        },
    ];
}

export default new Msg({
    type,
    builder,
});

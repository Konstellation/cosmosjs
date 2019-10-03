import MsgType from '../MsgType';

const type = 'cosmos-sdk/MsgUndelegate';

function builder ({amount: {amount, denom}, delegatorAddr, validatorAddr}) {
    return [
        {
            type,
            value: {
                amount: {
                    amount: String(amount),
                    denom: String(denom),
                },
                delegator_address: delegatorAddr,
                validator_address: validatorAddr,
            },
        },
    ];
}

export default new MsgType({
    type,
    builder,
});

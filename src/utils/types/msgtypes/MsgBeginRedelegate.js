import MsgType from '../MsgType';

const type = 'cosmos-sdk/MsgBeginRedelegate';

// eslint-disable-next-line max-len
function builder ({amount: {amount, denom}, delegatorAddr, validatorAddrTo, validatorAddrFrom}) {
    return [
        {
            type,
            value: {
                amount: {
                    amount: String(amount),
                    denom: String(denom),
                },
                delegator_address: delegatorAddr,
                validator_dst_address: validatorAddrTo,
                validator_src_address: validatorAddrFrom,
            },
        },
    ];
}

export default new MsgType({
    type,
    builder,
});

import Msg from '../../../types/Msg';

const type = 'cosmos-sdk/MsgBeginRedelegate';

function builder ({amount: {amount, denom}, delegatorAddr, validatorDstAddr, validatorSrcAddr}) {
    return [
        {
            type,
            value: {
                amount: {
                    amount: String(amount),
                    denom: String(denom),
                },
                delegator_address: delegatorAddr,
                validator_dst_address: validatorDstAddr,
                validator_src_address: validatorSrcAddr,
            },
        },
    ];
}

export default new Msg({
    type,
    builder,
});

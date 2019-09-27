import MsgType from '../MsgType';

const type = 'cosmos-sdk/MsgSend';

function builder ({from_address, to_address, amount, denom}) {
    return [
        {
            type,
            value: {
                amount: [
                    {
                        amount: String(amount),
                        denom: String(denom),
                    },
                ],
                from_address: String(from_address),
                to_address: String(to_address),
            },
        },
    ];
}

export default new MsgType({
    type,
    builder,
});

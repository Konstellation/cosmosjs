import Msg from '../../../types/Msg';

const type = 'cosmos-sdk/MsgSend';

function builder ({from, to, amount: {amount, denom}}) {
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
                from_address: String(from),
                to_address: String(to),
            },
        },
    ];
}

export default new Msg({
    type,
    builder,
});

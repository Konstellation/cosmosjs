import Msg from '../Msg';

const type = 'cosmos-sdk/MsgUnjail';

function builder ({validatorAddr: address}) {
    return [
        {
            type,
            value: {
                address,
            },
        },
    ];
}

export default new Msg({
    type,
    builder,
});

import Msg from '../Msg';

const type = 'issue/MsgBurnFrom';

function builder({
                     burnerAddr,
                     fromAddr,
                     amount,
                 }) {
    return [
        {
            type,
            value: {
                burner: burnerAddr,
                from_address: fromAddr,
                amount,
            }
        },
    ];
}

export default new Msg({
    type,
    builder,
});

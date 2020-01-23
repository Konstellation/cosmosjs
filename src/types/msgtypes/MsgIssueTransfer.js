import Msg from '../Msg';

const type = 'issue/MsgTransfer';

function builder({
                     fromAddr,
                     toAddr,
                     amount,
                 }) {
    return [
        {
            type,
            value: {
                from_address: fromAddr,
                to_address: toAddr,
                amount,
            }
        },
    ];
}

export default new Msg({
    type,
    builder,
});

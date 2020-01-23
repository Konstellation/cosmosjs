import Msg from '../Msg';

const type = 'issue/MsgTransferFrom';

function builder({
                     spenderAddr,
                     fromAddr,
                     toAddr,
                     amount,
                 }) {
    return [
        {
            type,
            value: {
                sender: spenderAddr,
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

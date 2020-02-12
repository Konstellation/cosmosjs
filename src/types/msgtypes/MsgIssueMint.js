import Msg from '../Msg';

const type = 'issue/MsgMint';

function builder({
                     minterAddr,
                     toAddr,
                     amount,
                 }) {
    return [
        {
            type,
            value: {
                minter: minterAddr,
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

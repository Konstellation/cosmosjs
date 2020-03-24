import Msg from '../Msg';

const type = 'issue/MsgTransferOwnership';

function builder({
                     ownerAddr,
                     toAddr,
                     denom,
                 }) {
    return [
        {
            type,
            value: {
                owner: ownerAddr,
                to_address: toAddr,
                denom,
            }
        },
    ];
}

export default new Msg({
    type,
    builder,
});

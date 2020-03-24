import Msg from '../Msg';

const type = 'issue/MsgDescription';

function builder({
                     ownerAddr: owner,
                     denom,
                     description,
                 }) {
    return [
        {
            type,
            value: {
                owner,
                denom,
                description,
            },
        },
    ];
}

export default new Msg({
    type,
    builder,
});

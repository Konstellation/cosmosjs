import Msg from '../Msg';

const type = 'issue/MsgBurn';

function builder({
                     burnerAddr,
                     amount,
                 }) {
    return [
        {
            type,
            value: {
                burner: burnerAddr,
                amount,
            }
        },
    ];
}

export default new Msg({
    type,
    builder,
});

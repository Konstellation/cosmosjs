import Msg from '../Msg';

const type = 'issue/MsgDecreaseAllowance';

function builder({
                     ownerAddr: owner,
                     spenderAddr: spender,
                     amount,
                 }) {
    return [
        {
            type,
            value: {
                owner,
                spender,
                amount,
            }
        },
    ];
}

export default new Msg({
    type,
    builder,
});

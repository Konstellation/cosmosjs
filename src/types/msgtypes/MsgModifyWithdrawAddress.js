import Msg from '../Msg';

const type = 'cosmos-sdk/MsgModifyWithdrawAddress';

function builder({delegator_address, withdraw_address}) {
    return [
        {
            type,
            value: {
                delegator_address,
                withdraw_address,
            }
        }
    ];
}

export default new Msg({
    type,
    builder
});

const MsgType = require('../MsgType');

const type = 'cosmos-sdk/MsgModifyWithdrawAddress';

function builder({delegator_address, withdraw_address}) {
    return [
        {
            type,
            value: {
                delegator_address,
                withdraw_address
            }
        }
    ];
}

module.exports = new MsgType({
    type,
    builder
});
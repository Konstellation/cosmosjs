const MsgType = require('../MsgType');

const type = 'cosmos-sdk/MsgWithdrawDelegationReward';

function builder({delegator_address, validator_address}) {
    return [
        {
            type,
            value: {
                delegator_address,
                validator_address
            }
        }
    ];
}

module.exports = new MsgType({
    type,
    builder
});
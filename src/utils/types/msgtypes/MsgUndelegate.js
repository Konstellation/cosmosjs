const MsgType = require('../MsgType');

const type = 'cosmos-sdk/MsgUndelegate';

function builder({amount, denom, delegator_address, validator_address}) {
    return [
        {
            type,
            value: {
                amount: {
                    amount: String(amount),
                    denom
                },
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
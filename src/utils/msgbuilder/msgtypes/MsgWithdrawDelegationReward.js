const MsgType = require('../MsgType');

const type = 'cosmos-sdk/MsgWithdrawDelegationReward';

function builder(input) {
    return {
        account_number: String(input.account_number),
        chain_id: input.chainId,
        fee: {
            amount: [
                {
                    amount: String(input.fee),
                    denom: input.feeDenom
                }
            ],
            gas: String(input.gas)
        },
        memo: input.memo,
        msgs: [
            {
                type: input.type,
                value: {
                    delegator_address: input.delegator_address,
                    validator_address: input.validator_address
                }
            }
        ],
        sequence: String(input.sequence)
    }
}

module.exports = new MsgType({
    type,
    builder
});
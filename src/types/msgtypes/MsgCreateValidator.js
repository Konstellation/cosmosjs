import Msg from '../Msg';

const type = 'cosmos-sdk/MsgCreateValidator';

function builder ({
                      value: {amount, denom},
                      delegatorAddr: delegator_address,
                      validatorAddr: validator_address,
                      pubkey,
                      minSelfDelegation: min_self_delegation,
                      commission: {rate, max_rate, max_change_rate},
                      description: {moniker, identity, website, details},
                  }) {
    return [
        {
            type,
            value: {
                delegator_address,
                validator_address,
                pubkey,
                description: {moniker, identity, website, details},
                value: {
                    amount: String(amount),
                    denom: String(denom),
                },
                commission: {
                    rate,
                    max_rate,
                    max_change_rate,
                },
                min_self_delegation,
            },
        },
    ];
}

export default new Msg({
    type,
    builder,
});

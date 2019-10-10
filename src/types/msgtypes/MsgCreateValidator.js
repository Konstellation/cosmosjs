import Msg from '../Msg';

const type = 'cosmos-sdk/MsgDelegate';

function builder ({
                      value: {amount, denom},
                      delegatorAddr,
                      validatorAddr,
                      pubkey,
                      min_self_delegation,
                      commission: {rate, max_rate, max_change_rate},
                      description: {moniker, identity, website, details},
                  }) {
    return [
        {
            type,
            value: {
                delegator_address: delegatorAddr,
                validator_address: validatorAddr,
                pubkey,
                value: {
                    amount: String(amount),
                    denom: String(denom),
                },
                min_self_delegation,
                commission: {
                    rate,
                    max_rate,
                    max_change_rate,
                },
                description: {moniker, identity, website, details},
            },
        },
    ];
}

export default new Msg({
    type,
    builder,
});

import Msg from '../Msg';

const type = 'cosmos-sdk/MsgCreateValidator';

function builder ({
                      validatorAddr: address,
                      description: {moniker, identity, website, details},
                      commission: {rate, max_rate, max_change_rate},
                      minSelfDelegation: min_self_delegation,
                  }) {
    return [
        {
            type,
            value: {
                address,
                description: {moniker, identity, website, details},
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

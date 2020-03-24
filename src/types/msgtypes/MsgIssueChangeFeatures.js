import Msg from '../Msg';

const type = 'issue/MsgFeatures';

function builder({
                     ownerAddr: owner,
                     denom,
                     burnOwnerDisabled: burn_owner_disabled,
                     burnHolderDisabled: burn_holder_disabled,
                     burnFromDisabled: burn_from_disabled,
                     mintDisabled: mint_disabled,
                     freezeDisabled: freeze_disabled,
                 }) {
    return [
        {
            type,
            value: {
                owner,
                denom,
                features: {
                    burn_from_disabled,
                    burn_holder_disabled,
                    burn_owner_disabled,
                    mint_disabled,
                    freeze_disabled,
                }
            },
        },
    ];
}

export default new Msg({
    type,
    builder,
});

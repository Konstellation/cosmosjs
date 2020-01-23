import Msg from '../Msg';

const type = 'issue/MsgIssueCreate';

function builder({
                     issuerAddr: issuer,
                     denom,
                     symbol,
                     totalSupply,
                     decimals,
                     description,
                     burnOwnerDisabled: burn_owner_disabled,
                     burnHolderDisabled: burn_holder_disabled,
                     burnFromDisabled: burn_from_disabled,
                     mintingFinished: minting_finished,
                     freezeDisabled: freeze_disabled,
                 }) {
    return [
        {
            type,
            value: {
                owner: issuer,
                issuer,
                params: {
                    denom,
                    symbol,
                    total_supply: String(totalSupply),
                    decimals: String(decimals),
                    description,
                    burn_from_disabled,
                    burn_holder_disabled,
                    burn_owner_disabled,
                    minting_finished,
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

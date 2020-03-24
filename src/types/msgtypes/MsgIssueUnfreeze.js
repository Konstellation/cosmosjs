import Msg from '../Msg';

const type = 'issue/MsgUnfreeze';

function builder({
                     freezerAddr,
                     holderAddr,
                     denom,
                     op,
                 }) {
    return [
        {
            type,
            value: {
                freezer: freezerAddr,
                holder: holderAddr,
                string: denom,
                op,
            }
        },
    ];
}

export default new Msg({
    type,
    builder,
});

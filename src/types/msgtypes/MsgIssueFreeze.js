import Msg from '../Msg';

const type = 'issue/MsgFreeze';

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
                denom,
                op,
            }
        },
    ];
}

export default new Msg({
    type,
    builder,
});

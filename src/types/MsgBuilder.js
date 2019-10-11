import MsgSend from './msgtypes/MsgSend';
import MsgDelegate from './msgtypes/MsgDelegate';
import MsgBeginRedelegate from './msgtypes/MsgBeginRedelegate';
import MsgUndelegate from './msgtypes/MsgUndelegate';
import MsgDeposit from './msgtypes/MsgDeposit';
import MsgWithdrawDelegationReward from './msgtypes/MsgWithdrawDelegationReward';
import MsgUnjail from './msgtypes/MsgUnjail';

export default class MsgBuilder {
    constructor () {
        this.msgTypes = {};
    }

    /**
     * Register concrete msg type
     *
     * @param {{type:string, builder: function}} msgType
     */
    addMsgType (msgType) {
        this.msgTypes[msgType.type] = msgType;
    }

    /**
     * Register msg types
     *
     * @returns {MsgBuilder}
     */
    registerMsgTypes () {
        this.addMsgType(MsgSend);
        this.addMsgType(MsgDelegate);
        this.addMsgType(MsgBeginRedelegate);
        this.addMsgType(MsgUndelegate);
        this.addMsgType(MsgWithdrawDelegationReward);
        this.addMsgType(MsgUnjail);
        this.addMsgType(MsgDeposit);

        return this;
    }

    /**
     * Find msg type by type
     * @param {string} type
     * @returns {Msg}
     */
    getMsgType (type) {
        return this.msgTypes[type];
        // !msgType ? new Error("No such input.type: " + type) : '';
    }
}

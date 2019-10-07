import MsgSend from './msgtypes/MsgSend';
import MsgDelegate from './msgtypes/MsgDelegate';
import MsgBeginRedelegate from './msgtypes/MsgBeginRedelegate';
import MsgUndelegate from './msgtypes/MsgUndelegate';
import MsgWithdrawDelegationReward from './msgtypes/MsgWithdrawDelegationReward';
import MsgWithdrawDelegationRewardsAll from './msgtypes/MsgWithdrawDelegationRewardsAll';

export default class MsgBuilder {
    constructor () {
        this.msgTypes = {};
    }

    addMsgType (msgType) {
        this.msgTypes[msgType.type] = msgType;
    }

    registerMsgTypes () {
        this.addMsgType(MsgSend);
        this.addMsgType(MsgDelegate);
        this.addMsgType(MsgBeginRedelegate);
        this.addMsgType(MsgUndelegate);
        this.addMsgType(MsgWithdrawDelegationReward);
        this.addMsgType(MsgWithdrawDelegationRewardsAll);

        return this;
    }

    getMsgType (type) {
        return this.msgTypes[type];
        // !msgType ? new Error("No such input.type: " + type) : '';
    }
}

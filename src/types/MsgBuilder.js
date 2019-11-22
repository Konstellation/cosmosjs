import MsgSend from './msgtypes/MsgSend';
import MsgCreateValidator from './msgtypes/MsgCreateValidator';
import MsgEditValidator from './msgtypes/MsgEditValidator';
import MsgDelegate from './msgtypes/MsgDelegate';
import MsgBeginRedelegate from './msgtypes/MsgBeginRedelegate';
import MsgUndelegate from './msgtypes/MsgUndelegate';
import MsgSubmitProposal from './msgtypes/MsgSubmitProposal';
import MsgUnjail from './msgtypes/MsgUnjail';
import MsgWithdrawDelegationReward from './msgtypes/MsgWithdrawDelegationReward';
import MsgDeposit from './msgtypes/MsgDeposit';
import MsgVote from './msgtypes/MsgVote';

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
        // msgs.forEach(msg => console.log(msg.type));
    }

    /**
     * Register msg types
     *
     * @returns {MsgBuilder}
     */
    registerMsgTypes () {
        // bank
        this.addMsgType(MsgSend);
        // staking
        this.addMsgType(MsgCreateValidator);
        this.addMsgType(MsgEditValidator);
        this.addMsgType(MsgDelegate);
        this.addMsgType(MsgBeginRedelegate);
        this.addMsgType(MsgUndelegate);
        // slashing
        this.addMsgType(MsgUnjail);
        // distribution
        this.addMsgType(MsgWithdrawDelegationReward);
        // gov
        this.addMsgType(MsgSubmitProposal);
        this.addMsgType(MsgDeposit);
        this.addMsgType(MsgVote);

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

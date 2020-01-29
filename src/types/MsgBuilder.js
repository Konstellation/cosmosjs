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
import MsgIssueCreate from './msgtypes/MsgIssueCreate';
import MsgIssueApprove from './msgtypes/MsgIssueApprove';
import MsgIssueTransfer from './msgtypes/MsgIssueTransfer';
import MsgIssueTransferFrom from './msgtypes/MsgIssueTransferFrom';
import MsgIssueIncreaseAllowance from './msgtypes/MsgIssueIncreaseAllowance';
import MsgIssueDecreaseAllowance from './msgtypes/MsgIssueDecreaseAllowance';

export default class MsgBuilder {
    constructor() {
        this.msgTypes = {};
    }

    /**
     * Register concrete msg type
     *
     * @param {{type:string, builder: function}} msgType
     */
    addMsgType(msgType) {
        this.msgTypes[msgType.type] = msgType;
    }

    /**
     * Register msg types
     *
     * @returns {MsgBuilder}
     */
    registerMsgTypes() {
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
        // issue
        this.addMsgType(MsgIssueCreate);
        this.addMsgType(MsgIssueApprove);
        this.addMsgType(MsgIssueTransfer);
        this.addMsgType(MsgIssueTransferFrom);
        this.addMsgType(MsgIssueIncreaseAllowance);
        this.addMsgType(MsgIssueDecreaseAllowance);

        return this;
    }

    /**
     * Find msg type by type
     * @param {string} type
     * @returns {Msg}
     */
    getMsgType(type) {
        return this.msgTypes[type];
        // !msgType ? new Error("No such input.type: " + type) : '';
    }
}

import MsgSend from './msgtypes/MsgSend';

export default class MsgBuilder {
    constructor() {
        this.msgTypes = {};
    }

    addMsgType(msgType) {
        this.msgTypes[msgType.type] = msgType;
    }

    registerMsgTypes() {
        this.addMsgType(MsgSend);

        return this;
    }

    getMsgType(type) {
        return this.msgTypes[type];
        // !msgType ? new Error("No such input.type: " + type) : '';
    }
}

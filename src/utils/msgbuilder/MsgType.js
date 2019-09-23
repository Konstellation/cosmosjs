module.exports = class MsgType {
    constructor({type, builder}) {
        this.type = type;
        this.builder = builder;
    }

    build(input) {
        return this.builder(input)
    }
};
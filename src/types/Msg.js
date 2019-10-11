export default class Msg {
    constructor ({type, builder}) {
        this.type = type;
        this.builder = builder;
    }

    /**
     * Build msg with input data
     *
     * @param {object} input
     * @returns {*}
     */
    build (input) {
        return this.builder(input);
    }
}

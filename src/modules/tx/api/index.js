import get from '../../../helpers/request/get';

export const FETCH_TRANSACTIONS = 'fetchTransactions';

export default {
    /**
     * Fetch transactions
     * @param {string|*} action
     * @param params
     * @returns {Promise<*>}
     */
    [FETCH_TRANSACTIONS] ({action = 'send', ...params}) {
        return get(this.apiUrl, {
            path: '/txs',
            query: {
                'message.action': action,
                ...params,
            },
        });
    },
};

import get from '../../../helpers/request/get';

export const FETCH_VALIDATORS = 'fetchValidators';
export const FETCH_STAKING_POOL = 'fetchStakingPool';

export default {
    /**
     * Fetch staking validators. Get all validator candidates.
     * By default it returns only the bonded validators.
     *
     * @param {string} status The validator bond status. Must be either 'bonded’, 'unbonded’, or 'unbonding’.
     * @param params {{ page: number, limit: number }}
     * @returns {Promise<*>}
     */
    [FETCH_VALIDATORS] (status, params = {}) {
        return get(this.apiUrl, {
            path: '/staking/validators',
            query: {
                status,
                ...params,
            },
        });
    },
    /**
     * Fetch current state of the staking pool
     *
     * @returns {Promise<*>}
     */
    [FETCH_STAKING_POOL] () {
        return get(this.apiUrl, {
            path: '/staking/pool',
        });
    },
};

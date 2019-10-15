import tx from './tx';
import staking from './staking';

const modules = {
    tx,
    staking,
};

// export const api = Object.entries(modules).map(([name, module]) => ({[name]: module.api})).reduce((acc, curr) => ({...acc, ...curr})).flat();
// export const routes = Object.values(modules).map(module => module.routes).flat();
// export const models = Object.values(modules).map(module => module.models).flat();
export const msgs = Object.values(modules).map(module => module.msgs).flat();
export const api = Object.assign({}, ...Object.values(modules).map(module => module.api).flat());

export default modules;

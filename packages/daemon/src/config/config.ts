import { constants } from '@pipcook/pipcook-core';

const  dialect = 'sqlite';
const storage = process.env.PIPCOOK_STORAGE || constants.PIPCOOK_STORAGE;

export {
  dialect,
  storage
};

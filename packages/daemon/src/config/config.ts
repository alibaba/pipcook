import { homedir } from 'os';


const  dialect = 'sqlite';
const storage = process.env.PIPCOOK_STORAGE || (`${homedir()}/.pipcook/db/pipcook.db`)


export {
  dialect,
  storage
};

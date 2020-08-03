
const os = require('os');

module.exports = {
  dialect: 'sqlite',
  storage: process.env.PIPCOOK_STORAGE || (`${os.homedir()}/.pipcook/db/pipcook.db`)
}


import * as opn from 'opn';

class AppBootHook {
  app!: any;

  constructor(app) {
    this.app = app;
  }

  async serverDidReady() {
    opn('http://127.0.0.1:7001/index.html');
  }
}

module.exports = AppBootHook;

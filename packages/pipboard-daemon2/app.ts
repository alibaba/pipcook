
import * as opn from 'better-opn';

class AppBootHook {
  app!: any;

  constructor(app) {
    this.app = app;
  }

  async serverDidReady() {
    this.app.model.sync()
    opn('http://127.0.0.1:7001/index.html');
  }
}

module.exports = AppBootHook;

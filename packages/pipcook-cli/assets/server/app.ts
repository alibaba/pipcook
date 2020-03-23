
import opn from 'better-opn';

class AppBootHook {
  app!: any;

  constructor(app) {
    this.app = app;
  }

  async serverDidReady() {
    opn('http://127.0.0.1:7001/public/index.html');
  }
}

module.exports = AppBootHook;

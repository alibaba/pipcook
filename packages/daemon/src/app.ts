import DB from './boot/database';

module.exports = app => {
  app.beforeStart(async () => {
    const db = (await app.applicationContext.getAsync('pipcookDB')) as DB;
    db.connect();
  });
};

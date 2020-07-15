export default {
  static: true,
  cors: {
    enable: true,
    package: 'egg-cors'
  },
  security: {
    domainWhiteList: [ 'http://localhost:4444' ]
  }
};

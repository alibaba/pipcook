export default {
  static: true,
  cors: {
    enable: true,
    package: 'egg-cors'
  },
  security: {
    domainWhiteList: [
      'http://localhost',
      'https://pipboard.vercel.app'
    ]
  }
};

const path = require('path');

const config = {
  entry: 'src/index.jsx',
  publicPath: './',
  plugins: [
    ['ice-plugin-fusion', {
      themePackage: '@icedesign/theme',
    }],
    ['ice-plugin-moment-locales', {
      locales: ['zh-cn'],
    }],
  ],
  alias: {
    '@': path.resolve(__dirname, './src/'),
  },
  proxy: {
    '/**': {
      enable: true,
      target: 'http://127.0.0.1:6927',
    },
  },
  define: {
    CWD: JSON.stringify(path.join(__dirname, '..', '..'))
  }
};

if (process.env.DEV === 'TRUE') {
  config.define.DEV = JSON.stringify('TRUE');
}

module.exports = config;

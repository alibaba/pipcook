const path = require('path');

const config = {
  entry: 'src/index.jsx',
  publicPath: './',
  plugins: [
    ['ice-plugin-fusion', {
      themePackage: '@icedesign/theme',
    }],
    ['ice-plugin-moment-locales', {
      locales: ['en-US'],
    }],
  ],
  alias: {
    '@': path.resolve(__dirname, './src/'),
    '@pipcook/pipcook-core': path.resolve(__dirname, 'node_modules/@pipcook/pipcook-core/dist'),
  },
  proxy: {
    '/**': {
      enable: true,
      target: 'http://127.0.0.1:6927',
    },
  },
  define: {
    CWD: JSON.stringify(path.join(__dirname, '..', '..')),
    DEV: process.env.DEV === 'TRUE' ? JSON.stringify('TRUE') : JSON.stringify('FALSE'),
  },
};

module.exports = config;

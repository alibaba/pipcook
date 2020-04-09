'use strict';

module.exports = {
  write: true,
  plugin: 'autod-egg',
  prefix: '^',
  devprefix: '^',
  exclude: [
    'test/fixtures',
    'coverage',
  ],
  dep: [
    'egg',
    'egg-scripts',
  ],
  devdep: [
    'autod',
    'autod-egg',
    'egg-bin',
    'tslib',
    'typescript',
  ],
  keep: [
  ],
  semver: [
  ],
  test: 'scripts',
};

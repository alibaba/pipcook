'use strict';

module.exports = () => {
  return function callable() {
    throw TypeError('not implemented.');
  };
};

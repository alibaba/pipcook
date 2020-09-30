'use strict';

const GetOwnershipSymbol = Symbol('GET_OWNERSHIP');

function notEmpty(line) {
  return /^\s*$/.test(line) === false;
}

function getIndent(lines) {
  let indent = 0;
  const firstChar = lines[0].match(/[^\s]/);
  if (firstChar != null) {
    indent = firstChar.index;
  }
  return indent;
}

function removeIndent(n) {
  return line => {
    const matchIndent = new RegExp(`^\\s{${n}}`, 'g')
    return line.replace(matchIndent, '');
  };
}

module.exports = {
  notEmpty,
  getIndent,
  removeIndent,
  // symbols
  GetOwnershipSymbol,
};

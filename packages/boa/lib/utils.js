'use strict';

const GetOwnershipSymbol = Symbol('GET_OWNERSHIP');
const PyGetAttrSymbol = Symbol('PYTHON_GETATTR_SYMBOL');
const PySetAttrSymbol = Symbol('PYTHON_SETATTR_SYMBOL');
const PyGetItemSymbol = Symbol('PYTHON_GETITEM_SYMBOL');
const PySetItemSymbol = Symbol('PYTHON_SETITEM_SYMBOL');

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
  PyGetAttrSymbol,
  PySetAttrSymbol,
  PyGetItemSymbol,
  PySetItemSymbol,
};

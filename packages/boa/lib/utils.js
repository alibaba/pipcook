'use strict';

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

exports.notEmpty = notEmpty;
exports.getIndent = getIndent;
exports.removeIndent = removeIndent;

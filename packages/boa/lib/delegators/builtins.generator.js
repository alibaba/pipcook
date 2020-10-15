module.exports = function *(T, wrap) {
  do {
    let curr = T.next();
    if (curr.done) {
      break;
    }
    yield wrap(curr.value);
  } while (true)
};
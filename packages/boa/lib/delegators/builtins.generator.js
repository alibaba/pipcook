module.exports = (T, wrap) => {
  function *generatorProxy() {
    do {
      let curr = T.next();
      if (curr.done) {
        break;
      }
      yield wrap(curr.value);
    } while (true);
  }

  return generatorProxy();
};

module.exports = (T, wrap) => {
  
  function *generator() {
    do {
      let curr = T.next();
      if (curr.done) {
        break;
      }
      yield wrap(curr.value);
    } while (true);
  };

  return generator();
};

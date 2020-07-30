
module.exports = function(data) {
  console.log(data);
  return {
    foobar: data.foobar,
    fn1: (a) => console.log(`fn1(${a})`),
    obj: {
      fn2: () => console.log(`fn2()`),
    },
  };
};

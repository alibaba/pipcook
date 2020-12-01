
module.exports = function(data) {
  console.log(data);
  if (data && data.exitAfter && typeof data.exitAfter === 'number') {
    const start = Date.now();
    console.log('loop in');
    for (;;) {
      if (Date.now() - start > data.exitAfter * 1000) {
        break;
      }
    }
    console.log('loop out');
  }
  return {
    foobar: data.foobar,
    fn1: (a) => console.log(`fn1(${a})`),
    obj: {
      fn2: () => console.log(`fn2()`)
    }
  };
};

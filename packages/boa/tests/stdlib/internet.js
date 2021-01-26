const test = require('ava');
const boa = require('../../');

// test('HTTP protocol client', t => {
//   const { HTTPSConnection } = boa.import('http.client');
//   {
//     const conn = HTTPSConnection('www.nodejs.org');
//     conn.request('GET', '/');
//     const resp = conn.getresponse();
//     t.strictEqual(resp.status > 0, true);
//     t.strictEqual(typeof resp.reason, 'string');
//   }
//   t.end();
// });

test('UUID objects according to RFC 4122', t => {
  const {
    uuid1,
    uuid3,
    uuid4,
    uuid5,
    NAMESPACE_DNS,
  } = boa.import('uuid');

  t.is(typeof uuid1(), 'object');
  t.is(typeof uuid3(NAMESPACE_DNS, 'nodejs.org'), 'object');
  t.is(typeof uuid4(), 'object');
  t.is(typeof uuid5(NAMESPACE_DNS, 'nodejs.org'), 'object');
});

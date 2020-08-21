const test = require('tape');
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

  t.ok(uuid1());
  t.ok(uuid3(NAMESPACE_DNS, 'nodejs.org'));
  t.ok(uuid4());
  t.ok(uuid5(NAMESPACE_DNS, 'nodejs.org'));
  t.end();
});

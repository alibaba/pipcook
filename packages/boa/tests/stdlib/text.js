const test = require('tape');
const boa = require('../../');
const string = boa.import('string');

test('String constants', t => {
  t.strictEqual(string.ascii_letters,
                'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
  t.strictEqual(string.ascii_lowercase, 'abcdefghijklmnopqrstuvwxyz');
  t.strictEqual(string.ascii_uppercase, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  t.strictEqual(string.digits, '0123456789');
  t.strictEqual(string.hexdigits, '0123456789abcdefABCDEF');
  t.strictEqual(string.octdigits, '01234567');
  t.strictEqual(string.punctuation,
                '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~');
  t.ok(string.whitespace);
  t.end();
});

test('String formatter', t => {
  const fmt = string.Formatter();
  t.strictEqual(fmt.format('foobar {0} {1}', 'a', 'b'), 'foobar a b');
  t.strictEqual(fmt.format('foobar {name}', boa.kwargs({ name: 'test' })),
                'foobar test');
  t.end();
});

test('String template', t => {
  const tmpl = string.Template('$who likes $what');
  const actual = tmpl.substitute(boa.kwargs({
    who: 'tim',
    what: 'kung pao'
  }));
  t.strictEqual(actual, 'tim likes kung pao');
  t.end();
});

test('Regular expression operations', t => {
  const re = boa.import('re');
  const m = re.search('(?<=abc)def', 'abcdef');
  t.equal(m.group(0), 'def');
  t.end();
});

test('Helpers for computing deltas', t => {
  const {
    get_close_matches,
    SequenceMatcher,
  } = boa.import('difflib');
  t.ok(get_close_matches('appel', ['ape', 'apple', 'peach', 'puppy']));
  {
    const s = SequenceMatcher(null, ' abcd', 'abcd abcd');
    const m = s.find_longest_match(0, 5, 0, 9);
    t.strictEqual(m.a, 0);
    t.strictEqual(m.b, 4);
    t.strictEqual(m.size, 5);
  }
  t.strictEqual(SequenceMatcher(null, 'tide', 'diet').ratio(), 0.25);
  t.strictEqual(SequenceMatcher(null, 'diet', 'tide').ratio(), 0.5);
  t.end();
});

test('Text wrapping and filling', t => {
  const { shorten, indent } = boa.import('textwrap');
  t.strictEqual(
    shorten('Hello  world!', boa.kwargs({ width: 12 })),
    'Hello world!'
  );
  t.strictEqual(
    shorten('Hello  world!', boa.kwargs({ width: 11 })),
    'Hello [...]'
  );
  t.strictEqual(
    shorten('Hello  world!', boa.kwargs({ width: 10, placeholder: '...' })),
    'Hello...'
  );
  t.strictEqual(indent('hello', '\t'), '\thello');
  t.end();
});

test('Unicode Database', t => {
  const unicodedata = boa.import('unicodedata');
  t.strictEqual(unicodedata.lookup('LEFT CURLY BRACKET'), '{');
  t.strictEqual(unicodedata.name('/'), 'SOLIDUS');
  t.strictEqual(unicodedata.decimal('9'), 9);
  t.strictEqual(unicodedata.category('A'), 'Lu');
  t.strictEqual(unicodedata.bidirectional('\u0660'), 'AN');
  t.end();
});

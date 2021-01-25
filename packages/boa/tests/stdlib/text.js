const test = require('ava');
const boa = require('../../');
const string = boa.import('string');

test('String constants', t => {
  t.is(string.ascii_letters, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
  t.is(string.ascii_lowercase, 'abcdefghijklmnopqrstuvwxyz');
  t.is(string.ascii_uppercase, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  t.is(string.digits, '0123456789');
  t.is(string.hexdigits, '0123456789abcdefABCDEF');
  t.is(string.octdigits, '01234567');
  t.is(string.punctuation, '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~');
  t.assert(string.whitespace);
});

test('String formatter', t => {
  const fmt = string.Formatter();
  t.is(fmt.format('foobar {0} {1}', 'a', 'b'), 'foobar a b');
  t.is(fmt.format('foobar {name}', boa.kwargs({ name: 'test' })),
                  'foobar test');
});

test('String template', t => {
  const tmpl = string.Template('$who likes $what');
  const actual = tmpl.substitute(boa.kwargs({
    who: 'tim',
    what: 'kung pao'
  }));
  t.is(actual, 'tim likes kung pao');
});

test('Regular expression operations', t => {
  const re = boa.import('re');
  const m = re.search('(?<=abc)def', 'abcdef');
  t.is(m.group(0), 'def');
});

test('Helpers for computing deltas', t => {
  const {
    get_close_matches,
    SequenceMatcher,
  } = boa.import('difflib');
  t.assert(get_close_matches('appel', ['ape', 'apple', 'peach', 'puppy']));
  {
    const s = SequenceMatcher(null, ' abcd', 'abcd abcd');
    const m = s.find_longest_match(0, 5, 0, 9);
    t.is(m.a, 0);
    t.is(m.b, 4);
    t.is(m.size, 5);
  }
  t.is(SequenceMatcher(null, 'tide', 'diet').ratio(), 0.25);
  t.is(SequenceMatcher(null, 'diet', 'tide').ratio(), 0.5);
});

test('Text wrapping and filling', t => {
  const { shorten, indent } = boa.import('textwrap');
  t.is(
    shorten('Hello  world!', boa.kwargs({ width: 12 })),
    'Hello world!'
  );
  t.is(
    shorten('Hello  world!', boa.kwargs({ width: 11 })),
    'Hello [...]'
  );
  t.is(
    shorten('Hello  world!', boa.kwargs({ width: 10, placeholder: '...' })),
    'Hello...'
  );
  t.is(indent('hello', '\t'), '\thello');
});

test('Unicode Database', t => {
  const unicodedata = boa.import('unicodedata');
  t.is(unicodedata.lookup('LEFT CURLY BRACKET'), '{');
  t.is(unicodedata.name('/'), 'SOLIDUS');
  t.is(unicodedata.decimal('9'), 9);
  t.is(unicodedata.category('A'), 'Lu');
  t.is(unicodedata.bidirectional('\u0660'), 'AN');
});

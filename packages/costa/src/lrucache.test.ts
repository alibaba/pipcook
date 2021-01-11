import test from 'ava';
import LRUCache from './lrucache';

test('should create a string lrucache.', (t) => {
  const cache = new LRUCache<string>(2);
  cache.put('foobar', '1');
  t.is(cache.get('foobar'), '1');
  cache.put('foobar2', '2');
  t.is(cache.get('foobar2'), '2');
  cache.put('foobar3', '3');
  t.is(cache.get('foobar3'), '3');
  t.is(cache.get('foobar'), undefined);
  t.is(cache.get('foobar2'), '2');
  cache.put('foobar', '11');
  t.is(cache.get('foobar3'), undefined);
  t.is(cache.get('foobar'), '11');
  t.is(cache.get('foobar2'), '2');
});

test('should create an object lrucache', (t) => {
  interface MO { id: string }
  const cache = new LRUCache<MO>(2);
  cache.put('m1', { id: '1' });
  t.is(cache.get('m1').id, '1');
  t.is(cache.get('unknown'), undefined);
});

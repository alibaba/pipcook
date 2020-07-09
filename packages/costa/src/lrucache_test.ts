import LRUCache from './lrucache';

describe('test lru cache', () => {
  it('should create a string lrucache.', () => {
    const cache = new LRUCache<string>(2);
    cache.put('foobar', '1');
    expect(cache.get('foobar')).toEqual('1');
    cache.put('foobar2', '2');
    expect(cache.get('foobar2')).toEqual('2');
    cache.put('foobar3', '3');
    expect(cache.get('foobar3')).toEqual('3');
    expect(cache.get('foobar')).toEqual(undefined);
    expect(cache.get('foobar2')).toEqual('2');
    cache.put('foobar', '11');
    expect(cache.get('foobar3')).toEqual(undefined);
    expect(cache.get('foobar')).toEqual('11');
    expect(cache.get('foobar2')).toEqual('2');
  });

  it('should create an object lrucache', () => {
    interface MO { id: string };
    const cache = new LRUCache<MO>(2);
    cache.put('m1', { id: '1' });
    expect(cache.get('m1').id).toEqual('1');
    expect(cache.get('unknown')).toEqual(undefined);
  });
});

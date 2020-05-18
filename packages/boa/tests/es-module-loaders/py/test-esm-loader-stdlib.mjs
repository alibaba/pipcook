import { strictEqual, ok, equal } from 'assert';
// export default
import os from 'py:os';
// named export
import { getenv, getpid } from 'py:os';
import { rgb_to_hsv } from 'py:colorsys';
import { getdefaultencoding, dont_write_bytecode } from 'py:sys';
import { ascii_letters, ascii_lowercase, digits, punctuation } from 'py:string';
import {
  ceil,
  copysign,
  erf,
  floor,
  factorial,
  gamma,
  lgamma,
} from 'py:math';
import {
  abs,
  bin,
  len,
  min,
  max,
  True,
  False,
  None,
  __debug__
} from 'py:builtins';

// builtins
strictEqual(True, true);
strictEqual(False, false);
strictEqual(None, null);
equal(abs(100), 100);
equal(abs(-100), 100);
equal(bin(3), '0b11');
ok(__debug__);


// os
strictEqual(os.getenv('USER'), getenv('USER'));
strictEqual(getpid() > 0, True);

// sys
ok(getdefaultencoding() === 'utf-8');
ok(typeof dont_write_bytecode === 'boolean');

// colorsys
const v = rgb_to_hsv(0.2, 0.8, 0.4);
ok(len(v) === 3);
ok(min(v) === 0.3888888888888889);
ok(max(v) === 0.8);

// math
strictEqual(ceil(10), 10);
strictEqual(copysign(1.0, -1.0), -1);
strictEqual(factorial(8), 40320);
strictEqual(floor(100.99), 100);
ok(erf(0.1));
strictEqual(gamma(1), 1);
strictEqual(gamma(2), 1);
strictEqual(gamma(3), 2);
ok(lgamma(5));


// string
strictEqual(ascii_letters,
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
strictEqual(ascii_lowercase, 'abcdefghijklmnopqrstuvwxyz');
strictEqual(digits, '0123456789');
strictEqual(punctuation, '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~');

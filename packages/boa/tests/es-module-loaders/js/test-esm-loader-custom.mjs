import { strictEqual } from 'assert';
import { add, subtract } from './test-esm-loader-math.mjs';
import math from './test-esm-loader-math.mjs';

// custom js
strictEqual(add(1, 2), math.add(1, 2));
strictEqual(subtract(1, 2), math.subtract(1, 2));

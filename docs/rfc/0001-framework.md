- Start Date: 2020-11-25
- Target Major Version: 2.0
- Reference Issues: (leave this empty)
- Implementation PR: (leave this empty)
- Author: @FeelyChau

# Summary

We have accumulated a lot of debt in the iteration process in Pipcook 1.0, and hope to solve these problems in 2.0.

# Test

The running cost of unit test and integration test is very different, but Pipcook 1.0 does not classify the tests well, which leads to the mixing of unit test and integration test, which will reduce the efficiency of continuous integration and cause trouble to test coding. In 2.0, we will make a clear division between unit testing and integration testing.

## Unit test

Unit test is the test of functions. Before writing the unit test code for an function, we should make clear the input and output boundary of the function to be tested and the exception handling method, and then we should cover the boundary pertinently and run it in a low-cost way so as to verify the change at any time.

In this way, we can ensure that the function works normally according to the design expectation. We have written many unit tests in 1.0, but there are still some problems as follows:

* insufficient coverage: `cli` is not covered, the coverage rate in other projects is 88%
* case design is not enough: there is no complete test design each unit
* too many test frameworks: `boa` uses `Tape`, `daemon` uses `Mocha`, and other projects use `Jasmine`

It is necessary to solve the above problems. The specific objectives and measures:

* the coverage rate of single test should be increased to more than **95%**
* the boundary of function input and output should be defined, tested and covered, the coverage of  `cli`  shoud be enabled
* test framework should be unified as `Ava`. Unit test cases should be as free of IO and side effects as possible, the parallel running mechanism of AVA will force us to write more efficient test codes

Switching the test framework to `Ava` will bring some refactoring work:

```js
// ava
import test from 'ava';
import * as fs from 'fs-extra';
import * as sinon from 'sinon';
import { shuffle } from './public';

test('array shuffle', (t) => {
  const array = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
  shuffle(array);
  t.notDeepEqual(array, [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);
  t.deepEqual(array.sort(), [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);
});

// serial hook
test.serial.afterEach(() => {
  sinon.restore();
});

// serial case
test.serial('test a', (t) => {
  const fsReadJsonMock = sinon.stub(fs, 'readJson').resolves({});
  t.deepEqual(await fs.readJson('mockFileName.json'), {});
});

test.serial('test b', (t) => {
  const fsReadJsonMock = sinon.stub(fs, 'readJson').resolves(undefined);
  t.is(await fs.readJson('mockFileName.json'), undefined);
});

test.todo('some todo cases');
```

```js
// jasmine
import { shuffle } from './public';

describe('public utils', () => {
  it('test if the array is shuffled', () => {
    const array = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
    shuffle(array);
    expect(array).not.toEqual([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);
    expect(array.sort()).toEqual([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);
  });
}
```

## Integration test

The integration test of pipbook 1.0 depends on the workflow configuration file. In a strict sense, this is not a rigorous integration testing method and hard to maintain. In addition, we do not assert any of the running process except exit code. This situation will be improved in pipbook 2.0 as follows:

* define integration test cases
* use or develop an intergration test framework suitable for pipbook
* extend the run environment

# Framework migration for Daemon

The framework of daemon will be moved from the original framework to `loopback 4` for the following reasons:

* automatic code generation capability
* framework maturity: the version of typescript cannot be configured in the original framework, resulting in the overall size of the pipbook package unable to be trimmed, and the test framework is constrained and cannot be switched
* internationalization

# Framework migration for Pipboard

The pipboard UI library will be migrated from the original framework to the [new framework](https://ant.design/), and the packaging tools will be migrated from `webpack` to `parcel`. The advantages of internationalization, familiarity of community contributors and convenience of use of `parcel` are mainly considered.

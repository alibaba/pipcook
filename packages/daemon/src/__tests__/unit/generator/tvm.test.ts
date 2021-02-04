import {
  sinon
} from '@loopback/testlab';
import test from 'ava';
import * as tvm from '../../../generator/tvm';
import * as fs from 'fs-extra';
import * as cp from 'child_process';
import { GenerateOptions } from '../../../services';

test.serial.afterEach(() => {
  sinon.restore();
});

test.serial('should return when no h5 files are there', async (t) => {

  const mockFSReaddir = sinon.stub(fs, 'readdir').resolves([ 'test' ]);
  const projPackage = {};
  const opts: GenerateOptions = {} as GenerateOptions;

  await tvm.generateTVM('dist', projPackage, opts);

  t.true(mockFSReaddir.called, 'readdir should be called');
});

test.serial('should run tvm.cli', async (t) => {

  const mockFSReaddir = sinon.stub(fs, 'readdir').resolves([ 'test.h5' ]);
  const mockFork = sinon.stub(cp, 'fork').returns({
    on: (e: string, resolve: any) => {
      if (e === 'exit') {
        resolve();
      }
    }
  });
  const projPackage = {};
  const opts: GenerateOptions = {} as GenerateOptions;

  await tvm.generateTVM('dist', projPackage, opts);

  t.true(mockFSReaddir.called, 'readdir should be called');
  t.true(mockFork.called, 'fork should be called');
});


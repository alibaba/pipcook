import {
  sinon
} from '@loopback/testlab';
import test from 'ava';
import * as node from '../../../generator/nodejs';
import * as fs from 'fs-extra';
import { Job } from '../../../models';
import { GenerateOptions } from '../../../services';

test.serial.afterEach(() => {
  sinon.restore();
});

test.serial('test node generator', async (t) => {

  const mockFSCopy = sinon.stub(fs, 'copy').resolves();
  const mockFSOutputJSON = sinon.stub(fs, 'outputJSON').resolves();
  const mockObj = { } as Job;
  const mockPackage = { } as any;
  const opts = {
    plugins: {
      modelDefine: {
        name: 'test',
        version: '1'
      },
      dataProcess: {
        name: 'test',
        version: '1'
      }
    }
  } as GenerateOptions;

  node.generateNode(mockObj, mockPackage, 'test', opts);

  t.true(mockFSOutputJSON.called, 'outputJSON should be called');
  t.true(mockFSCopy.called, 'copy should be called');
});

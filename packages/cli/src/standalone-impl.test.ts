import { PipelineMeta } from '@pipcook/costa';
import test from 'ava';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import { createStandaloneRT } from './standalone-impl';

test.serial.afterEach(() => sinon.restore());

test('create standalone runtime', (t) => {
  const pipelineMeta: PipelineMeta = {
    specVersion: 'v2.0',
    dataSource: 'file:///tmp/datasource.js',
    dataflow: [ 'file:///tmp/dataflow.js' ],
    model: 'file:///tmp/model.js',
    artifacts: [
      {
        processor: 'my-artifact-plugin',
        option: '123'
      }
    ],
    options: {
      pipelineOption: 'abc'
    }
  };
  const mockDataSourceApi: any = {};
  const rt = createStandaloneRT(mockDataSourceApi, pipelineMeta, '/tmp');
  t.is((rt as any).pipelineConfig, pipelineMeta, 'pipelineConfig should equal');
  t.is((rt as any).dataSource, mockDataSourceApi, 'dataSource should equal');
  t.is((rt as any).modelDir, '/tmp', 'dataSource should equal');
});

test.serial('runtime interface', async (t) => {
  const pipelineMeta: PipelineMeta = {
    specVersion: 'v2.0',
    dataSource: 'file:///tmp/datasource.js',
    dataflow: [ 'file:///tmp/dataflow.js' ],
    model: 'file:///tmp/model.js',
    artifacts: [
      {
        processor: 'my-artifact-plugin',
        option: '123'
      }
    ],
    options: {
      pipelineOption: 'abc'
    }
  };
  const mockDataSourceApi: any = {};
  const rt = createStandaloneRT(mockDataSourceApi, pipelineMeta, '/tmp');
  const stubLog = sinon.stub(console, 'log');
  await rt.notifyProgress({ value: 10, extendData: {} });
  t.true(stubLog.calledOnce, 'console.log should be called once');
  t.is(await rt.readModel(), '/tmp', 'readModel should be correct');
});

test.serial('runtime save model with path', async (t) => {
  const pipelineMeta: PipelineMeta = {
    specVersion: 'v2.0',
    dataSource: 'file:///tmp/datasource.js',
    dataflow: [ 'file:///tmp/dataflow.js' ],
    model: 'file:///tmp/model.js',
    artifacts: [
      {
        processor: 'my-artifact-plugin',
        option: '123'
      }
    ],
    options: {
      pipelineOption: 'abc'
    }
  };
  const mockDataSourceApi: any = {};
  const stubCopy = sinon.stub(fs, 'copy').resolves();
  const rt = createStandaloneRT(mockDataSourceApi, pipelineMeta, '/tmp');
  await rt.saveModel('/tmp/file.json');
  t.false(stubCopy.called, 'copy should not be called');
  await rt.saveModel('/data/file.json');
  t.true(stubCopy.calledOnce, 'copy should be called once');
  t.deepEqual(stubCopy.args[0], [ '/data/file.json', '/tmp' ] as any, 'should copy to the correct path');
});

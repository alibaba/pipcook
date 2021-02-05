import test from 'ava';
import * as sinon from 'sinon';
import * as childProcess from 'child_process';
import { Readable, Writable } from 'stream';
import * as utils from './utils';
import { NpmPackageMetadata } from './index';

class StringWritable extends Writable {
  data = '';
  constructor() {
    super();
  }

  _write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void {
    this.data += chunk;
    callback();
  }
}

class StringReadable extends Readable {

  s = '';
  bytesRead = 0;

  constructor(s: string) {
    super();
    this.s = s;
  }

  _read(size: number) {
    const rst = this.s.slice(this.bytesRead, size);
    this.bytesRead += size;
    if (this.bytesRead > this.s.length && !rst) {
      this.push(null);
    }
    this.push(rst);
  }
}

test.serial.afterEach(() => sinon.restore());

test.cb('test pipeLog', (t) => {
  const mockString = 'this is a mock string: line1\nline2\n';
  const correctString = 'mockPrefix: this is a mock string: line1\nmockPrefix: line2\n';
  const writeStream = new StringWritable();
  const readStream = new StringReadable(mockString);
  utils.pipeLog(readStream, writeStream, 'mockPrefix');
  readStream.on('end', () => {
    console.log('writeStream.data:', writeStream.data);
    t.is(writeStream.data, correctString);
    t.end();
  });
});

test.cb('test pipeLog without prefix', (t) => {
  const mockString = 'this is a mock string: line1\nline2\n';
  const writeStream = new StringWritable();
  const readStream = new StringReadable(mockString);
  utils.pipeLog(readStream, writeStream);
  readStream.on('end', () => {
    console.log('writeStream.data:', writeStream.data);
    t.is(writeStream.data, mockString);
    t.end();
  });
});

test.cb('test pipeLog with error', (t) => {
  const mockString = 'this is a mock string: line1\nline2\n';
  const writeStream = new StringWritable();
  const readStream = new StringReadable(mockString);
  const error = new TypeError('mock error');
  writeStream.on('error', (err) => {
    t.is(err, error, 'should throw error');
    t.end();
  });
  utils.pipeLog(readStream, writeStream);
  readStream.emit('error', error);
});

test('should select npm package beta', (t) => {
  const mockNpmPakcage = {
    name: 'mockName'
  };
  const metadata: NpmPackageMetadata = {
    _id: 'mockId',
    _rev: 'mockRev',
    name: 'mockName',
    'dist-tags': {
      beta: 'beta-1',
      latest: 'v1.0.0'
    },
    versions: {
      'beta-1': mockNpmPakcage as any
    }
  };
  const source: any = {
    name: 'mockSouceName',
    schema: { version: 'beta' }
  };
  t.deepEqual(utils.selectNpmPackage(metadata, source), mockNpmPakcage);
});

test('should select npm package beta but not beta version found', (t) => {
  const mockNpmPakcage = {
    name: 'mockName'
  };
  const metadata: NpmPackageMetadata = {
    _id: 'mockId',
    _rev: 'mockRev',
    name: 'mockName',
    'dist-tags': {
      latest: 'v1.0.0'
    },
    versions: {
      'beta-1': mockNpmPakcage as any
    }
  };
  const source: any = {
    name: 'mockSouceName',
    schema: { version: 'beta' }
  };
  t.throws(() => utils.selectNpmPackage(metadata, source), {
    instanceOf: TypeError, message: 'the package "mockSouceName" has no beta version.'
  });
});

test('should select npm package lastest', (t) => {
  const mockNpmPakcage = {
    name: 'mockName'
  };
  const metadata: NpmPackageMetadata = {
    _id: 'mockId',
    _rev: 'mockRev',
    name: 'mockName',
    'dist-tags': {
      latest: 'v1.0.0'
    },
    versions: {
      'v1.0.0': mockNpmPakcage as any
    }
  };
  const source: any = {
    name: 'mockSouceName',
    schema: { version: 'latest' }
  };
  t.deepEqual(utils.selectNpmPackage(metadata, source), mockNpmPakcage);
});

test('should select npm package with specific version', (t) => {
  const mockNpmPakcage = {
    name: 'mockName'
  };
  const metadata: NpmPackageMetadata = {
    _id: 'mockId',
    _rev: 'mockRev',
    name: 'mockName',
    'dist-tags': {
      latest: 'v1.0.0'
    },
    versions: {
      'v1.0.0': mockNpmPakcage as any
    }
  };
  const source: any = {
    name: 'mockSouceName',
    schema: { version: 'v1.0.0' }
  };
  t.deepEqual(utils.selectNpmPackage(metadata, source), mockNpmPakcage);
});

test('should select npm package without version', (t) => {
  const mockNpmPakcage = {
    name: 'mockName'
  };
  const metadata: NpmPackageMetadata = {
    _id: 'mockId',
    _rev: 'mockRev',
    name: 'mockName',
    'dist-tags': {
      latest: 'v1.0.0'
    },
    versions: {
      'v1.0.0': mockNpmPakcage as any
    }
  };
  const source: any = {
    name: 'mockSouceName',
    schema: {}
  };
  t.deepEqual(utils.selectNpmPackage(metadata, source), mockNpmPakcage);
});

test.serial('should spawn successfully', async (t) => {
  const stubChildProcessOn = sinon.stub().callsFake((event: string, fn: (code: number) => void) => {
    t.is(event, 'close', 'event should be "close"');
    process.nextTick(() => fn(0));
  });
  const stubSpawn = sinon.stub(childProcess, 'spawn').returns({
    on: stubChildProcessOn
  } as any);
  const stubPipeLog = sinon.stub(utils, 'pipeLog');
  const spawnOption: any = {};
  const log = {
    stdout: process.stdout,
    stderr: process.stderr,
    prefix: 'prefix'
  };
  await utils.spawnAsync('mockCommand', [], spawnOption, log);
  t.true(stubPipeLog.calledTwice, 'pipeLog should be called twice');
  t.true(stubSpawn.calledOnce, 'spwan should be called once');
});

test.serial('should spawn but error thrown', async (t) => {
  const stubChildProcessOn = sinon.stub().callsFake((event: string, fn: (code: number) => void) => {
    t.is(event, 'close', 'event should be "close"');
    process.nextTick(() => fn(1));
  });
  const stubSpawn = sinon.stub(childProcess, 'spawn').returns({
    on: stubChildProcessOn
  } as any);
  const stubPipeLog = sinon.stub(utils, 'pipeLog');
  const spawnOption: any = {};
  const log = {
    stdout: process.stdout,
    stderr: process.stderr,
    prefix: 'prefix'
  };
  await t.throwsAsync(utils.spawnAsync('mockCommand', [], spawnOption, log), {
    instanceOf: TypeError, message: 'invalid code 1 from mockCommand'
  });
  t.true(stubPipeLog.calledTwice, 'pipeLog should be called twice');
  t.true(stubSpawn.calledOnce, 'spwan should be called once');
});

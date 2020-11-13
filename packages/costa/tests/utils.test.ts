import { Readable, Writable } from 'stream';
import { pipeLog } from '../src/utils';

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

it('test pipeLog', async () => {
  const mockString = 'this is a mock string: line1\nline2\n';
  const correctString = 'mockPrefix: this is a mock string: line1\nmockPrefix: line2\n';
  const writeStream = new StringWritable();
  const readStream = new StringReadable(mockString);
  await pipeLog(readStream, writeStream, 'mockPrefix');
  console.log(writeStream.data);
  expect(writeStream.data).toBe(correctString);
});

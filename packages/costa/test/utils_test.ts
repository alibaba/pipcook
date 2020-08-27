import path from 'path';
import { createReadStream, createWriteStream, remove } from 'fs-extra';
import { pipeGracefully } from '../src/utils';

it('test pipe with finish event', async () => {
  let step = 0;
  const writeFile = path.join(__dirname, 'utils_test.ts_test');
  const readStream = createReadStream(path.join(__dirname, 'utils_test.js'));
  const writeStream = createWriteStream(writeFile);
  readStream.on('end', () => expect(step++).toBe(0));
  writeStream.on('finish', () => expect(step++).toBe(1));
  await pipeGracefully(readStream, writeStream);
  expect(step).toBe(2);
  await remove(writeFile);
});

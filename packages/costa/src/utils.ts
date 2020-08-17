export interface LogStdio {
  stdout: NodeJS.WritableStream;
  stderr: NodeJS.WritableStream;
}

/**
 * pipe a stream to another one, we fork multi child processes serially here,
 * Readable.pipi() will close the target pipe when end, we should ignore the end event.
 * @param readable child process stdout/stderr
 * @param writable the log stream
 */
export function pipe(readable: NodeJS.ReadableStream, writable: NodeJS.WritableStream): void {
  readable.on('error', (err) => {
    writable.emit('error', err);
  });
  readable.on('data', async (data) => {
    writable.write(data);
  });
}

/**
 * pipe read stream to write steam with finish event
 * @param readStream the read stream
 * @param writeStream the write stream
 */
export function pipeWithFinish(readStream: NodeJS.ReadableStream, writeStream: NodeJS.WritableStream): Promise<void> {
  return new Promise((resolve, reject) => {
    readStream.pipe(writeStream);
    readStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('finish', resolve);
  });
}

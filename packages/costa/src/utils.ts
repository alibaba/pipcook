import { Readable, Writable } from 'stream';

export interface LogStdio {
  stdout: Writable;
  stderr: Writable;
}

/**
 * pipe a stream to another one, we fork multi child processes serially here,
 * Readable.pipi() will close the target pipe when end, we should ignore the end event.
 * @param readable child process stdout/stderr
 * @param writable the log stream
 */
export function pipe(readable: Readable, writable: Writable): void {
  readable.on('error', (err) => {
    writable.emit('error', err);
  });
  readable.on('data', async (data) => {
    writable.write(data);
  });
}

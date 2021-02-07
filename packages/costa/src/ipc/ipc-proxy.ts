import { ChildProcess } from 'child_process';
import { IPCOutput } from '../protocol';
import Debug from 'debug';
const debug = Debug('costa.runnable');

export class IPCTimeoutError extends TypeError {
  code: string;
  constructor(msg: string) {
    super(msg || 'ipc timeout.');
    this.code = 'IPC_TIMEOUT';
  }
}

export class IPCProxy {
  id = 0;
  callMap: Record<number, (err: Error, result: Record<string, any>) => void> = {};
  constructor(
    private child: ChildProcess,
    private timeout = 3000
  ) {
    const listener = this.msgHandler.bind(this);
    this.child.on('message', listener);
    this.child.once('exit', this.onCleanup.bind(this, listener));
  }

  onCleanup(listener: any, code: number, signal: string): void {
    debug(`the runnable(${this.id}) has been destroyed with(code=${code}, signal=${signal}).`);
    for (const id in this.callMap) {
      this.callMap[id](new TypeError(`the runnable(${this.id}) has been destroyed with(code=${code}, signal=${signal}).`), null);
    }
    this.callMap = {};
    this.child.off('message', listener);
  }

  msgHandler(msg: IPCOutput): void {
    debug('msg from child', msg);
    if (msg && typeof msg === 'object' && this.callMap[msg.id]) {
      let err;
      if (msg.error) {
        err = new Error(msg.error.message);
        err.stack = msg.error.stack;
      }
      this.callMap[msg.id](err, msg.result);
    }
  }

  async call(method: string, args: any[] = undefined, timeout: number = undefined): Promise<any> {
    if (!this.child.connected) {
      throw new TypeError('the process is disconnected.');
    }
    return new Promise((resolve, reject) => {
      const currentId = this.id++;
      const t = timeout || this.timeout;
      let timer: NodeJS.Timeout = undefined;
      if (timeout > 0) {
        timer = setTimeout(() => {
          delete this.callMap[currentId];
          reject(new IPCTimeoutError(`call '${method}' timeout.`));
        }, t);
      }
      this.callMap[currentId] = (err, result) => {
        if (timer) {
          clearTimeout(timer);
        }
        delete this.callMap[currentId];
        err ? reject(err) : resolve(result);
      };
      const rst = this.child.send({ id: currentId, method, args }, (err: Error) => {
        if (err) {
          reject(err);
        }
      });
      if (!rst) {
        reject(new TypeError('send ipc message error'));
      }
    });
  }
}

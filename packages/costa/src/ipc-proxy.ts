import { ChildProcess } from 'child_process';
import { IPCOutput } from './protocol';
export class IPCProxy {
  id = 0;
  callMap: Record<number, (err: Error, result: Record<string, any>) => void> = {};
  constructor(
    private child: ChildProcess,
    private timeout = 3000
  ) {
    this.child = child;
    const listener = this.msgHandler.bind(this);
    this.child.on('message', listener);
    this.child.once('exit', () => this.child.off('message', listener));
    this.timeout = timeout;
  }

  msgHandler(msg: IPCOutput) {
    if (msg && typeof msg === 'object' && this.callMap[msg.id]) {
      let err;
      if (msg.error) {
        err = new Error(msg.error.message);
        err.stack = msg.error.stack;
      }
      this.callMap[msg.id](err, msg.result);
    }
  };

  async call(method: string, args: any[] = undefined, timeout: number = undefined): Promise<any> {
    return new Promise((r, j) => {
      const currentId = this.id++;
      const t = timeout || this.timeout;
      let timer: NodeJS.Timeout = undefined;
      if (timeout > 0) {
        timer = setTimeout(() => {
          delete this.callMap[currentId];
          j(new TypeError(`call '${method}' timeout`));
        }, t);
      }
      this.callMap[currentId] = (err, result) => {
        if (timer) {
          clearTimeout(timer);
        }
        delete this.callMap[currentId];
        err ? j(err) : r(result);
      };
      const rst = this.child.send({id: currentId, method, args}, (err: Error) => {
        if (err) {
          j(err);
        }
      });
      if (!rst) {
        j(new TypeError('send ipc message error'));
      };
    });
  }

  destory() {
    this.child.kill('SIGKILL');
  }
}

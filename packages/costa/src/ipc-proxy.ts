import { ChildProcess } from 'child_process';

export class IPCProxy {
  id = 0;
  callMap: Record<number, (err: Error, result: Record<string, any>) => void> = {};
  listener: (msg: any) => void = null;
  constructor(
    private child: ChildProcess,
    private timeout = 3000
  ) {
    this.child = child;
    this.listener = this.msgHandler.bind(this);
    this.child.on('message', this.listener);
    this.child.on('exit', () => this.child.off('message', this.listener));
    this.timeout = timeout;
  }

  msgHandler(msg: any) {
    if (this.callMap[msg.id]) {
      this.callMap[msg.id](msg.error, msg.result);
    }
  };

  async call(method: string, args: any[] = undefined, timeout: number = undefined): Promise<any> {
    return new Promise((r, j) => {
      const currentId = this.id++;
      const t = timeout || this.timeout;
      let timer: NodeJS.Timeout = undefined;
      if (timeout !== 0) {
        timer = setTimeout(() => {
          delete this.callMap[currentId];
          j(new TypeError(`call '${method}' timeout`));
        }, t);
      }
      this.callMap[currentId] = (err, result) => {
        err ? j(err) : r(result);
        if (timer) {
          clearTimeout(timer);
        }
        delete this.callMap[currentId];
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

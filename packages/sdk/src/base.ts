import { listen } from './request';
import { LogCallback } from './interface';

export class BaseApi {
  route: string;

  constructor(uri: string) {
    this.route = uri;
  }

  /**
   * listen log
   * @param logId log id
   * @param logCallback log callback
   */
  async log(logId: string, logCallback: LogCallback) {
    return new Promise((resolve, reject) => {
      listen(`${this.route}/log/${logId}`, undefined, {
        'log': (e: MessageEvent) => {
          const logObj = JSON.parse(e.data);
          if (logCallback) {
            logCallback(logObj.level, logObj.data);
          }
        },
        'error': (e: MessageEvent) => {
            reject(e.data);
        },
        'close': () => {
          resolve();
        }
      });
    });
  }
}
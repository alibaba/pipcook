import { listen } from './request';
import { EventCallback } from './interface';

export class BaseApi {
  route: string;

  constructor(uri: string) {
    this.route = uri;
  }

  /**
   * trace event
   * @param traceId trace id
   * @param eventCallback event callback
   */
  traceEvent(traceId: string, eventCallback: EventCallback): Promise<void> {
    return new Promise((resolve, reject) => {
      // TODO(feely): listen all event and transfer out
      listen(`${this.route}/event/${traceId}`, undefined, {
        'log': (e: MessageEvent) => {
          const eventObj = JSON.parse(e.data);
          if (typeof eventCallback === 'function') {
            eventCallback('log', eventObj);
          }
        },
        'error': (e: MessageEvent) => {
          reject(new Error(e.data));
        },
        'close': () => {
          resolve();
        }
      });
    });
  }
}

import { listen } from './request';
import { EventCallback, LogEvent, JobStatusChangeEvent } from './interface';

export class BaseApi {
  route: string;

  constructor(uri: string) {
    this.route = uri;
  }

  /**
   * trace event, after `Job.run()`, `Pipeline.install()`, `Plugin.createByName()`,
   * `Plugin.createByTarball()` we can get the `traceId` for tracing the progress event.
   * @param traceId trace id
   * @param eventCallback event callback
   */
  traceEvent(traceId: string, eventCallback: EventCallback): Promise<void> {
    return new Promise((resolve, reject) => {
      // TODO(feely): listen all event and transfer out
      listen(`${this.route}/event/${traceId}`, undefined, {
        'log': (e: MessageEvent) => {
          const eventObj = JSON.parse(e.data) as LogEvent;
          if (typeof eventCallback === 'function') {
            eventCallback('log', eventObj);
          }
        },
        'job_status': (e: MessageEvent) => {
          const eventObj = JSON.parse(e.data) as JobStatusChangeEvent;
          if (typeof eventCallback === 'function') {
            eventCallback('job_status', eventObj);
          }
        },
        'error': (e: MessageEvent) => {
          reject(new Error(e.data));
        },
        'close': () => {
          resolve();
        }
      }).catch(reject);
    });
  }
}

import { ResponseParams } from './request';
import { getJobById, getLogById } from './service/job';

export function fetchLog(data: ResponseParams, logs: string) {
  setTimeout(async () => {
    try {
      const jobInfo = await getJobById(data.id);
      if (!(jobInfo.status === 2 || jobInfo.status === 3)) {
        let log = await getLogById(data.id);
        log = log.log;
        let incrementLog;
        if (logs) {
          incrementLog = log.substring(log.indexOf(logs) + 1);
        } else {
          incrementLog = log;
        }    
        console.log(incrementLog);
        fetchLog(data, logs);
      }
    } catch (err) {
      console.error(err?.stack);
    }
  }, 2000);
}

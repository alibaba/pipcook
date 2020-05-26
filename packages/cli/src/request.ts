import * as qs from 'querystring';
import axios from 'axios';
import ora from 'ora';
import EventSource from 'eventsource';

export type RequestParams = Record<string, any>;
export type ResponseParams = Record<string, any>;
const spinner = ora();

class EventSourceError extends TypeError {
  event: Event;
  constructor(e: Event) {
    super('event source error event');
    this.event = e;
  }
}

function createGeneralRequest(agent: Function): Function {
  return async (...args: any[]) => {
    try {
      let response = await agent(...args);
      if (response.data.status === true) {
        return response.data.data;
      }
    } catch (err) {
      if (err?.response?.data?.message) {
        spinner.fail(err.response.data.message);
        process.exit();
      } else {
        throw err;
      }
    }
  };
}


export const post = async (host: string, body?: RequestParams, params?: RequestParams) => createGeneralRequest(axios.post)(host, body, params);
export const put = async (host: string, body?: RequestParams, params?: RequestParams) => createGeneralRequest(axios.put)(host, body, params);
export const remove = async (host: string) => createGeneralRequest(axios.delete)(host);
export const get = async (host: string, params?: RequestParams) => {
  const uri = `${host}?${qs.stringify(params)}`;
  return createGeneralRequest(axios.get)(uri);
};
export const listen = async (host: string, params?: RequestParams): Promise<EventSource> => {
  const uri = `${host}?${qs.stringify({ verbose: 1, ...params })}`;
  const es = new EventSource(uri);
  return new Promise((resolve) => {
    es.addEventListener('session', (e: MessageEvent) => {
      if (e.data === 'close') {
        es.close();
      }
    });
    resolve(es);
  });
};

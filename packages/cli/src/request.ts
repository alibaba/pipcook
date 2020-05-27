import * as qs from 'querystring';
import axios from 'axios';
import ora from 'ora';
import EventSource from 'eventsource';

export type RequestParams = Record<string, any>;
export type ResponseParams = Record<string, any>;


function createGeneralRequest(agent: Function): Function {
  const spinner = ora();
  return async (...args: any[]) => {
    try {
      let response = await agent(...args);
      if (response.data.status === true) {
        return response.data.data;
      }
    } catch (err) {
      if (err?.response?.data?.message) {
        spinner.fail(err.response.data.message);
      } else {
        console.error('daemon is not started, run "pipcook daemon start"');
      }
      return process.exit(1);
    }
  };
}

export const post = async (host: string, body?: RequestParams, params?: RequestParams) => createGeneralRequest(axios.post)(host, body, params);
export const put = async (host: string, body?: RequestParams, params?: RequestParams) => createGeneralRequest(axios.put)(host, body, params);
export const del = async (host: string) => createGeneralRequest(axios.delete)(host);
export const get = async (host: string, params?: RequestParams) => {
  const uri = `${host}?${qs.stringify(params)}`;
  return createGeneralRequest(axios.get)(uri);
};

export const listen = async (host: string, params?: RequestParams,
                             handlers?: Record<string, EventListener>): Promise<EventSource> => {
  return new Promise((resolve) => {
    const uri = `${host}?${qs.stringify({ verbose: 1, ...params })}`;
    const es = new EventSource(uri);
    const timeoutHandle = setTimeout(() => {
      es.close();
      console.error('connects to daemon timeout, please run "pipcook daemon restart".');
    }, 5000);
    const onerror = (e: Event) => {
      es.close();
      clearTimeout(timeoutHandle);
      console.error('daemon is not started, run "pipcook daemon start"');
    };

    es.addEventListener('error', onerror);
    es.addEventListener('session', (e: MessageEvent) => {
      if (e.data === 'close') {
        es.close();
      } else if (e.data === 'start') {
        clearTimeout(timeoutHandle);
        resolve(es);
      }
      es.removeEventListener('error', onerror);
    });

    // register extra handlers.
    Object.keys(handlers).forEach((name: string) => {
      es.addEventListener(name, handlers[name]);
    });
  });
};

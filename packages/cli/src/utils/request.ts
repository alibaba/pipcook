import * as qs from 'querystring';
import { promisify } from 'util';
import axios, { AxiosPromise, AxiosRequestConfig } from 'axios';
import * as fs from 'fs-extra';
import * as EventSource from 'eventsource';
import * as FormData from 'form-data';

export type RequestParams = Record<string, any>;
export type ResponseParams = Record<string, any>;
type ErrorEvent = {
  status?: number;
  message: string;
} & Event;

function createGeneralRequest(
  agent: (...args: any[]) => AxiosPromise<any>
): (...args: any[]) => Promise<any> {
  return async (...args: any[]) => {
    try {
      const response = await agent(...args);
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        throw new Error(response?.data?.message);
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message);
    }
  };
}

export const post = async (host: string, body?: RequestParams, params?: RequestParams, config?: AxiosRequestConfig): Promise<any> => createGeneralRequest(axios.post)(host, body, params, config);
export const put = async (host: string, body?: RequestParams, params?: RequestParams, config?: AxiosRequestConfig): Promise<any> => createGeneralRequest(axios.put)(host, body, params, config);
export const del = async (host: string): Promise<any> => createGeneralRequest(axios.delete)(host);
export const get = async (host: string, params?: RequestParams): Promise<any> => {
  const uri = `${host}?${qs.stringify(params)}`;
  return createGeneralRequest(axios.get)(uri);
};

export const getFile = async (host: string, params?: RequestParams): Promise<NodeJS.ReadStream> => {
  const resp = await axios({
    method: 'GET',
    url: `${host}?${qs.stringify(params)}`,
    responseType: 'stream'
  });
  return resp.data as NodeJS.ReadStream;
};

export const uploadFile = async (host: string, file: string, params?: RequestParams): Promise<any> => {
  const stream = fs.createReadStream(file);
  const form = new FormData();
  for (const key in params) {
    if (params[key]) {
      form.append(key, params[key]);
    }
  }
  form.append('file', stream);

  const getLength = promisify(form.getLength.bind(form));
  const length = await getLength();
  const headers = Object.assign({ 'Content-Length': length }, form.getHeaders());
  return axios.post(host, form, { headers });
};

export const listen = async (host: string, params?: RequestParams, handlers?: Record<string, EventListener>): Promise<EventSource> => {
  return new Promise((resolve) => {
    let handshaked = false;
    const uri = `${host}?${qs.stringify({ verbose: 1, ...params })}`;
    const es = new EventSource(uri);
    const timeoutHandle = setTimeout(() => {
      es.close();
      console.error('connects to daemon timeout, please run "pipcook daemon restart".');
    }, 5000);
    const onerror = (e: ErrorEvent) => {
      if (handshaked === false) {
        es.close();
        clearTimeout(timeoutHandle);
        es.removeEventListener('error', onerror);

        // print error
        if (typeof e.status === 'number') {
          console.error('occurrs an daemon error with the following response:\n', e);
        } else {
          console.error(`daemon is not started(${e.message}), run "pipcook daemon start".`);
        }
      } else if (typeof handlers.error === 'function') {
        // manually pass the `error` event to user-defined handler.
        handlers.error(e);
      }
    };

    es.addEventListener('error', onerror);
    es.addEventListener('session', (e: MessageEvent) => {
      if (e.data === 'close') {
        // close the connection and mark the handshaked is disabled.
        handshaked = false;
        es.close();
      } else if (e.data === 'start') {
        handshaked = true;
        // if `handlers.error` not defined, remove the listener directly.
        if (typeof handlers.error !== 'function') {
          es.removeEventListener('error', onerror);
        }
        // clear the timeout handle because handshake is finished.
        clearTimeout(timeoutHandle);
        resolve(es);
      }
    });

    // register extra handlers.
    Object.keys(handlers)
      // handle `handlers.error` manually.
      .filter((name: string) => name !== 'error')
      .forEach((name: string) => {
        es.addEventListener(name, handlers[name]);
      });
  });
};

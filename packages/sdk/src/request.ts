import * as qs from 'querystring';
import axios, { AxiosRequestConfig } from 'axios';
import EventSource from 'eventsource';
import { promisify } from 'util';
import { ReadStream } from 'fs-extra';
import FormData from 'form-data';

export type RequestParams = Record<string, any>;
export type ResponseParams = Record<string, any>;
export interface FileDownloadResp {
  totalBytes: number;
  stream: NodeJS.ReadStream;
}

axios.defaults.timeout = 60000;

function createGeneralRequest(agent: Function): Function {
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

export const post = async (host: string, body?: RequestParams, params?: RequestParams, config?: AxiosRequestConfig) => createGeneralRequest(axios.post)(host, body, params, config);
export const put = async (host: string, body?: RequestParams, params?: RequestParams, config?: AxiosRequestConfig) => createGeneralRequest(axios.put)(host, body, params, config);
export const del = async (host: string) => createGeneralRequest(axios.delete)(host);
export const get = async (host: string, params?: RequestParams, config?: AxiosRequestConfig) => {
  let uri: string;
  if (params) {
    uri = `${host}?${qs.stringify(params)}`;
  } else {
    uri = host;
  }
  return createGeneralRequest(axios.get)(uri, config);
};

export const uploadFile = async (host: string, fileStream: ReadStream, params?: RequestParams): Promise<any> => {
  const form = new FormData();
  for (const key in params) {
    if (params[key]) {
      form.append(key, params[key]);
    }
  }
  form.append('file', fileStream);

  const getLength = promisify(form.getLength.bind(form));
  const length = await getLength();
  const headers = Object.assign({ 'Content-Length': length }, form.getHeaders());
  try {
    const response = await axios.post(host, form, { headers });
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(response?.data?.message);
    }
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message);
  }
};

export const getFile = async (host: string, params?: RequestParams): Promise<FileDownloadResp> => {
  const resp = await axios({
    method: 'GET',
    url: `${host}?${qs.stringify(params)}`,
    responseType: 'stream'
  });
  const totalBytes = parseInt(resp.headers['content-length'], 10);
  return { totalBytes, stream: resp.data as NodeJS.ReadStream };
};

export const listen = async (host: string, params?: RequestParams, handlers?: Record<string, EventListener>): Promise<EventSource> => {
  return new Promise((resolve, reject) => {
    let handshaked = false;
    const uri = `${host}${params ? `?${qs.stringify(params)}` : ''}`;
    const es = new EventSource(uri);
    const timeoutHandle = setTimeout(() => {
      es.close();
      reject(new Error(`listen timeout: ${uri}`));
    }, 5000);
    const onerror = (e: Event) => {
      if (handshaked === false) {
        es.close();
        clearTimeout(timeoutHandle);
        es.removeEventListener('error', onerror);
        reject(new Error(`listen error: ${e.type}`));
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
        if (typeof handlers.close === 'function') {
          handlers.close(e);
        }
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

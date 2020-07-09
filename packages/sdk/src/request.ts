import * as qs from 'querystring';
import axios, { AxiosRequestConfig } from 'axios';
import EventSource from 'eventsource';

export type RequestParams = Record<string, any>;
export type ResponseParams = Record<string, any>;

function createGeneralRequest(agent: Function): Function {
  return async (...args: any[]) => {
    let response;
    try {
      response = await agent(...args);
    } catch (err) {
      throw new Error(err?.response?.data?.message || err.message);
    }
    if (response.data.status === true) {
      return response.data.data;
    } else {
      throw new Error(response?.data?.message);
    }
  };
}

export const post = async (host: string, body?: RequestParams, params?: RequestParams, config?: AxiosRequestConfig) => createGeneralRequest(axios.post)(host, body, params, config);
export const put = async (host: string, body?: RequestParams, params?: RequestParams, config?: AxiosRequestConfig) => createGeneralRequest(axios.put)(host, body, params, config);
export const del = async (host: string) => createGeneralRequest(axios.delete)(host);
export const get = async (host: string, params?: RequestParams, config?: AxiosRequestConfig) => {
  const uri = `${host}?${qs.stringify(params)}`;
  return createGeneralRequest(axios.get)(uri, config);
};

export const getFile = async (host: string, params?: RequestParams): Promise<NodeJS.ReadStream> => {
  const resp = await axios({
    method: 'GET',
    url: `${host}?${qs.stringify(params)}`,
    responseType: 'stream'
  });
  return resp.data as NodeJS.ReadStream;
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
    const onerror = (e: Event) => {
      if (handshaked === false) {
        es.close();
        clearTimeout(timeoutHandle);
        console.error('daemon is not started, run "pipcook daemon start"');
        es.removeEventListener('error', onerror);
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

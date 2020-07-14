import axios from 'axios';
import qs from 'querystring';
import { messageError } from './message';

const daemonHostPrefix = 'http://localhost:6927';

const createGeneralRequest = (agent) => async (...args) => {
  try {
    const response = await agent(...args);
    if (response.data.status === true) {
      return response.data.data;
    } else {
      messageError(response.data.message);
    }
  } catch (err) {
    messageError(err?.response.data.message);
  }
};
export const get = async (host, params) => createGeneralRequest(axios.get)(host, params);
export const post = async (host, body, params) => createGeneralRequest(axios.post)(host, body, params);
export const put = async (host, body, params) => createGeneralRequest(axios.put)(host, body, params);
export const remove = async (host) => createGeneralRequest(axios.delete)(host);
export const listen = async (host, params, handlers) => {
  return new Promise((resolve) => {
    let handshaked = false;
    const uri = [ daemonHostPrefix, host, `?${qs.stringify({ verbose: 1, ...params })}` ].join('');
    const es = new EventSource(uri);
    const timeoutHandle = setTimeout(() => {
      es.close();
      console.error('connects to daemon timeout.');
    }, 5000);
    const onerror = (e) => {
      if (handshaked === false) {
        es.close();
        clearTimeout(timeoutHandle);
        console.error(e);
        es.removeEventListener('error', onerror);
      } else if (typeof handlers.error === 'function') {
        // manually pass the `error` event to user-defined handler.
        handlers.error(e);
      }
    };

    es.addEventListener('error', onerror);
    es.addEventListener('session', (e) => {
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
      .filter((name) => name !== 'error')
      .forEach((name) => {
        es.addEventListener(name, handlers[name]);
      });
  });
};
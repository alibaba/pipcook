import axios from 'axios';
import {messageError} from './message';

const createGeneralRequest = (agent) => async (...args) => {
  try {
    const response = await agent(...args);
    if (response.data.status === true) {
      return response.data.data;
    } else {
      messageError(response.data.message);
    }
  } catch (err) {
    messageError(err.response.data.message);
  }
};
export const get = async (host, params) => createGeneralRequest(axios.get)(host, params);
export const post = async (host, body, params) => createGeneralRequest(axios.post)(host, body, params);
export const put = async (host, body, params) => createGeneralRequest(axios.put)(host, body, params);
export const remove = async (host) => createGeneralRequest(axios.delete)(host);
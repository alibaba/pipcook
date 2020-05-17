import axios from 'axios';
import ora from 'ora';

const spinner = ora();

export type RequestParams = Record<string, any>;

export type ResponseParams = Record<string, any>;

const createGeneralRqeuest = (agent: Function) => async (...args: any[]) => {
  try {
    let response = await agent(...args);
    if (response.data.status === true) {
      return response.data.data;
    }
  } catch (err) {
    if (err?.response.data.message) {
      spinner.fail(err.response.data.message);
      process.exit();
    } else {
      throw err;
    }
  }
};
export const get = async (host: string, params?: RequestParams) => createGeneralRqeuest(axios.get)(host, params);
export const post = async (host: string, body?: RequestParams, params?: RequestParams) => createGeneralRqeuest(axios.post)(host, body, params);
export const put = async (host: string, body?: RequestParams, params?: RequestParams) => createGeneralRqeuest(axios.put)(host, body, params);
export const remove = async (host: string) => createGeneralRqeuest(axios.delete)(host);

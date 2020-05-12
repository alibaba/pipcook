import axios from 'axios';
import ora from 'ora';

const spinner = ora();

interface RequestParams {
  [key: string]: any;
}

export async function get(host: string, params?: RequestParams) {
  try {
    let response = await axios.get(host, {
      params
    });
    if (response.data.status === true) {
      return response.data.data;
    }
  } catch (err) {
    if (err.response && err.response.data && err.response.data.message) {
      spinner.fail(err.response.data.message);
      process.exit();
    } else {
      throw err;
    }
  }
}

export async function post(host: string, body?: RequestParams, params?: RequestParams) {
  try {
    let response = await axios.post(host, body, params);
    if (response.data.status === true) {
      return response.data.data;
    }
  } catch (err) {
    if (err.response && err.response.data && err.response.data.message) {
      spinner.fail(err.response.data.message);
      process.exit();
    } else {
      throw err;
    }
  }
}

export async function put(host: string, body?: RequestParams, params?: RequestParams) {
  try {
    let response = await axios.put(host, body, params);
    if (response.data.status === true) {
      return response.data.data;
    }
  } catch (err) {
    if (err.response && err.response.data && err.response.data.message) {
      spinner.fail(err.response.data.message);
      process.exit();
    } else {
      throw err;
    }
  }
}

export async function remove(host: string) {
  try {
    let response = await axios.delete(host);
    if (response.data.status === true) {
      return response.data.data;
    }
  } catch (err) {
    if (err.response && err.response.data && err.response.data.message) {
      spinner.fail(err.response.data.message);
      process.exit();
    } else {
      throw err;
    }
  }
}
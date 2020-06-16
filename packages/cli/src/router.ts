export const HOST = 'http://127.0.0.1';
export const PORT = 6927;

const getRoute = (pathname: string) => `${HOST}:${PORT}/${pathname}`;

export const route = {
  app: getRoute('app'),
  job: getRoute('job'),
  pipeline: getRoute('pipeline'),
  plugin: getRoute('plugin')
};

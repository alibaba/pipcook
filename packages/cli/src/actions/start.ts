import { StartHandler } from '../types';
import { install, run } from '../pipeline';

const start: StartHandler = async (filename: string, opts: any) => {
  await install(filename, opts);
  return run(filename, opts);
};

export default start;

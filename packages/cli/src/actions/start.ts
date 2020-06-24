import { StartHandler } from '../types';
import { run } from '../pipeline';

const start: StartHandler = async (filename: string, opts: any) => {
  return run(filename, opts);
};

export default start;

import { execAsync } from '../utils/common';

export default async function() {
  await execAsync('open http://127.0.0.1:6927/index.html');
}

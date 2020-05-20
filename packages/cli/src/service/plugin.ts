import { post } from '../request';
import { route } from '../router';

export async function install(name: string) {
  return post(route.plugin, {
    name
  });
}

export async function uninstall(path: string) {
  const data = await post(route.plugin, {
    config: path
  });
  return data;
}

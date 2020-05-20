import { post } from '../request';
import { route } from '../router';

export async function install(name: string) {
  return post(`${route.plugin}/install`, {
    name
  });
}

export async function uninstall(path: string) {
  return post(`${route.plugin}/uninstall`, {
    config: path
  });
}

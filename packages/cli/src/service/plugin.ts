import { get, listen } from '../request';
import { route } from '../router';
import ora from 'ora';

export async function install(name: string) {
  const spinner = ora();
  spinner.start(`fetching package info ${name}`);
  let es = await listen(`${route.plugin}/install`, { name });
  es.addEventListener('info', (e: MessageEvent) => {
    const pkg = JSON.parse(e.data);
    spinner.start(`installing ${pkg.name} from ${pkg.pipcook.source.uri}`);
  });
  es.addEventListener('installed',(e: MessageEvent) => {
    const pkg = JSON.parse(e.data);
    spinner.succeed(`${pkg.name} installed.`);
  });
  es.addEventListener('error', (e: MessageEvent) => {
    spinner.fail(`install failed with ${e?.data}`);
  });
}

export async function uninstall(name: string) {
  const spinner = ora();
  spinner.start(`uninstalling ${name}`);
  await get(`${route.plugin}/uninstall`, { name });
  spinner.succeed(`uninstalled ${name}`);
}

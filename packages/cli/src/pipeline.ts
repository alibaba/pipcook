import { ora, parseConfigFilename, cwd } from "./utils";
import { tunaMirrorURI } from "./config";
import { route } from "./router";
import { listen } from "./request";

export async function install(filename: string, opts: any): Promise<void> {
  const spinner = ora();

  try {
    filename = await parseConfigFilename(filename);
  } catch (err) {
    spinner.fail(err.message);
    return process.exit(1);
  }
  const params = {
    cwd: cwd(),
    config: filename,
    pyIndex: opts.tuna ? tunaMirrorURI : undefined
  };
  await listen(`${route.pipeline}/install`, params, {
    'info': (e: MessageEvent) => {
      const info = JSON.parse(e.data);
      spinner.succeed(info);
    },
    'installed': (e: MessageEvent) => {
      const plugin = JSON.parse(e.data);
      spinner.succeed(`plugin (${plugin.name}@${plugin.version}) is installed`);
    },
    'finished': () => {
      spinner.succeed('all plugins installed');
      process.exit(0);
    },
    'error': (e: MessageEvent) => {
      spinner.fail(`occurrs an error ${e.data}`);
      process.exit(1);
    }
  });
}

import { ChildProcess } from 'child_process';
import { PluginPackage, RunnableResponse } from '../runtime';
import { IPCProxy } from './ipc-proxy';

export interface Entry {
  handshake: () => Promise<string>;
  load: (pkg: PluginPackage, timeout: number) => Promise<void>;
  start: (pkg: PluginPackage, ...pluginArgs: any) => Promise<RunnableResponse | undefined>;
  destroy: (timeout: number) => Promise<void>;
  valueOf: (obj: RunnableResponse) => Promise<any>;
}

export const killProcessIfError = (process: ChildProcess, future: Promise<any>): Promise<any> => {
  return future.catch((err) => {
    process.kill('SIGKILL');
    throw err;
  });
};

export const setup = (id: string, child: ChildProcess): Entry => {
  const ipc = new IPCProxy(id, child);
  return {
    handshake: async (): Promise<string> => {
      return killProcessIfError(child, ipc.call('handshake', [ id ]));
    },
    load: async (pkg: PluginPackage, timeout: number): Promise<void> => {
      return killProcessIfError(child, ipc.call('load', [ pkg ], timeout));
    },
    start: (pkg: PluginPackage, ...pluginArgs: any): Promise<RunnableResponse | undefined> => {
      return killProcessIfError(child, ipc.call('start', [ pkg, ...pluginArgs ], 0));
    },
    destroy: (timeout: number): Promise<void> => {
      return killProcessIfError(child, ipc.call('destroy', undefined, timeout));
    },
    valueOf: (obj: RunnableResponse): Promise<any> => {
      return killProcessIfError(child, ipc.call('valueOf', [ obj ]));
    }
  };
};

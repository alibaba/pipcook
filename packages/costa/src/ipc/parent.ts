import { ChildProcess as IPC } from 'child_process';
import { PluginPackage, RunnableResponse } from '../runtime';
import { IPCProxy } from './ipc-proxy';

export interface Entry {
  handshake: (id: string) => Promise<string>;
  load: (pkg: PluginPackage, timeout: number) => Promise<void>;
  start: (pkg: PluginPackage, ...pluginArgs: any) => Promise<RunnableResponse | undefined>;
  destroy: (timeout: number) => Promise<void>;
  valueOf: (obj: RunnableResponse) => Promise<any>;
}

export const killProcessIfError = (process: IPC, future: Promise<any>): Promise<any> => {
  return future.catch((err) => {
    process.kill('SIGKILL');
    throw err;
  });
};

export const setup = (child: IPC): Entry => {
  const ipc = new IPCProxy(child);
  return {
    handshake: async (id: string): Promise<string> => {
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

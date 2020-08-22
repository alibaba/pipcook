
import { PluginPackage, BootstrapArg, PluginRunnable, InstallOptions, CostaRuntime, RunnableResponse } from '@pipcook/costa';
import { EvaluateResult, UniDataset } from '@pipcook/pipcook-core';

class MockRunnable extends PluginRunnable {
  valueOfResult: EvaluateResult & UniDataset = {
    pass: true,
    metadata: {},
    dataStatistics: [
      {
        metricName: 'metricName1',
        metricValue: 1
      },
      {
        metricName: 'metricName2',
        metricValue: 2
      }
    ],
    validationResult: {
        result: true,
        message: 'validationResult message'
    },
    batchSize: 100,
    trainLoader: undefined,
    validationLoader: undefined,
    testLoader: undefined
  };
  bootstrap(arg: BootstrapArg): Promise<void> {
    return;
  }
  async valueOf(resp: RunnableResponse): Promise<object> {
    console.log('valueOf', resp);
    return this.valueOfResult;
  }
  start(pkg: PluginPackage, ...args: any[]): Promise<RunnableResponse | null> {
    return;
  }
  destroy(): Promise<void> {
    return;
  }
}

export class MockCosta extends CostaRuntime {
  mockPkg: PluginPackage = {
    name: '',
    version: '1.0.0',
    main: 'index.js',
    description: 'desc',
    dependencies: {
      'pipcook@/boa': '1.0.0'
    },
    pipcook: {
      category: 'dataCollect',
      source: {
        from: 'fs',
        uri: 'uri',
        urlObject: undefined,
        name: '',
        schema: undefined
      },
      datatype: 'image',
      runtime: 'nodejs'
    },
    conda: {
      python: '3.7',
      dependencies: {
        'tensorflow': '2.2.0'
      }
    }
  };
  constructor() {
    super({
      installDir: '',
      datasetDir: '',
      componentDir: '',
      npmRegistryPrefix: ''
    });
  }
  /**
   * fetch plugin package info by plugin name
   * @param name plugin name
   */
  fetchFromInstalledPlugin(name: string): Promise<PluginPackage> {
    return;
  }
  /**
   * fetch and check if the package name is valid.
   * @param name the plugin package name.
   */
  async fetch(name: string): Promise<PluginPackage> {
    console.log(`fetch ${name}`);
    return { name, ...this.mockPkg };
  }
  /**
   * fetch and check if the package name is valid.
   * @param name the plugin package readstream for npm package tarball.
   * @param cwd the current working directory.
   */
  async fetchByStream(stream: NodeJS.ReadableStream): Promise<PluginPackage> {
    return this.mockPkg;
  }
  /**
   * Install the given plugin by name.
   * @param pkg the plugin package.
   * @param opts install options
   */
  async install(pkg: PluginPackage, opts: InstallOptions): Promise<boolean> {
    return true;
  }
  /**
   * Uninstall the given plugin by name.
   * @param name the plugin package name.
   */
  async uninstall(name: string | string[]): Promise<boolean> {
    return true;
  }
  /**
   * create a runnable.
   */
  async createRunnable(args?: BootstrapArg): Promise<PluginRunnable> {
    return new MockRunnable(this);
  }
}
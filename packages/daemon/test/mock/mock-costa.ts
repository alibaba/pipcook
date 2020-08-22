
import { PluginPackage, BootstrapArg, PluginRunnable, InstallOptions, CostaRuntime, RunnableResponse, LogStdio } from '@pipcook/costa';
import { EvaluateResult, UniDataset, constants as CoreConstants } from '@pipcook/pipcook-core';
import { mkdirpSync } from 'fs-extra';
import { join } from 'path';

class MockRunnable extends PluginRunnable {
  mockLogger: LogStdio;
  canceled = false;
  constructor(rt: CostaRuntime, logger?: LogStdio, id?: string) {
    super(rt, logger, id);
    this.mockLogger = logger;
  }

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
    console.log('mock valueOf', resp);
    return this.valueOfResult;
  }
  start(pkg: PluginPackage, ...args: any[]): Promise<RunnableResponse | null> {
    return new Promise((resolve, reject) => {
      console.log('mock run plugin ', pkg.name);
      setTimeout(() => {
        if (this.canceled) {
          return reject(new Error('mock runtime destoried'));
        }
        if (this.mockLogger) {
          this.mockLogger.stderr.write(`[err] mock job log for ${pkg.name}\n`);
          this.mockLogger.stdout.write(`[out] mock job log for ${pkg.name}\n`);
        }
        resolve();
      }, 1000);
      // TODO(feely): check if the current plugin is a model-train plugin
      mkdirpSync(join(this.workingDir, 'model'));
    })
  }
  destroy(): Promise<void> {
    this.canceled = true;
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
      installDir: CoreConstants.PIPCOOK_PLUGINS,
      datasetDir: CoreConstants.PIPCOOK_DATASET,
      componentDir: CoreConstants.PIPCOOK_RUN,
      npmRegistryPrefix: 'https://registry.npmjs.com/'
    });
  }
  /**
   * fetch plugin package info by plugin name
   * @param name plugin name
   */
  async fetchFromInstalledPlugin(name: string): Promise<PluginPackage> {
    console.log('mock fetchFromInstalledPlugin', name);
    return { ...this.mockPkg, name };
  }
  /**
   * fetch and check if the package name is valid.
   * @param name the plugin package name.
   */
  async fetch(name: string): Promise<PluginPackage> {
    console.log(`mock fetch ${name}`);
    // TODO(feely): config plugin package info by user
    return { ...this.mockPkg, name };
  }
  /**
   * fetch and check if the package name is valid.
   * @param name the plugin package readstream for npm package tarball.
   * @param cwd the current working directory.
   */
  async fetchByStream(stream: NodeJS.ReadableStream): Promise<PluginPackage> {
    console.log('mock fetchByStream');
    return this.mockPkg;
  }
  /**
   * Install the given plugin by name.
   * @param pkg the plugin package.
   * @param opts install options
   */
  async install(pkg: PluginPackage, opts: InstallOptions): Promise<boolean> {
    console.log('mock install', pkg.name);
    return new Promise((resolve) => {
      setTimeout(() => {
        opts.stderr.write(`[err] install ${pkg.name}\n`);
        opts.stdout.write(`[out] install ${pkg.name}\n`);
        resolve(true);
      }, 100);
    });
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
    return new MockRunnable(this, args?.logger, args?.id);
  }
}

import { provide, inject } from 'midway';
import PluginRuntime from '../boot/plugin';
import { PluginModelStatic, PluginModel } from '../model/plugin';
import { PluginPackage } from '@pipcook/costa';
import * as uuid from 'uuid';

class PluginNotFound extends TypeError {
  status: number;
  plugin: string;
  constructor(name: string) {
    super(`cannot find the plugin "${name}"`);
    this.plugin = name;
    this.status = 400;
  }
}

type ListPluginsFilter = {
  datatype?: string,
  category?: string
};

@provide('PluginManager')
export class PluginManager {

  @inject('pluginModel')
  model: PluginModelStatic;

  @inject('pluginRT')
  pluginRT: PluginRuntime;

  async fetch(name: string): Promise<PluginPackage> {
    return this.pluginRT.costa.fetch(name);
  }

  async list(filter?: ListPluginsFilter): Promise<PluginModel[]> {
    const where = {} as any;
    if (filter.category) {
      where.category = filter.category;
    }
    if (filter.datatype) {
      where.datatype = filter.datatype;
    }
    return this.model.findAll({ where });
  }

  async install(pkg: PluginPackage): Promise<PluginModel> {
    const [ plugin ] = await this.model.findOrCreate({
      where: {
        name: pkg.name,
        version: pkg.version
      },
      defaults: {
        id: uuid.v1(),
        name: pkg.name,
        version: pkg.version,
        category: pkg.pipcook.types.plugin,
        datatype: pkg.pipcook.types.dataset,
        dest: pkg.pipcook.target.DESTPATH
      }
    });
    await this.pluginRT.costa.install(pkg);
    return plugin;
  }

  async uninstall(name: string): Promise<void> {
    const { costa } = this.pluginRT;
    const plugins = await this.model.findAll({
      where: { name }
    });
    if (plugins.length === 0) {
      throw new PluginNotFound(name);
    }
    await plugins.map(async (plugin: PluginModel) => {
      await costa.uninstall(plugin.name);
      await plugin.destroy();
    });
  }
}

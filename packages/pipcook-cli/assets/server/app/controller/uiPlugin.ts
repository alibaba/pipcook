import { Controller } from 'egg';
import * as glob from 'glob-promise';
// import * as fs from 'fs-extra';
import * as path from 'path';

import { successRes } from '../utils/index';


export default class UiPluginController extends Controller {

  public async list() {
    const { ctx } = this;
    const pluginPaths = await glob(path.join(__dirname, '..', 'public', 'plugins', '*'));
    const plugins = pluginPaths.map(pluginPath => {
      return {
        pluginName: path.basename(pluginPath),
        pluginPath: `/public/plugins/${path.basename(pluginPath)}/index.html`,
      };
    });
    return successRes(ctx, {
      plugins,
    });
  }
}

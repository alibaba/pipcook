import { Controller } from 'egg';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob-promise';
import { v1 as uuidv1 } from 'uuid';
import * as shell from 'shelljs';

import { successRes, failRes } from '../utils/index';
import { PLUGIN_TYPES } from '../utils/constants';
import { generateCode } from '../utils/codes';

const LOG_PATH = path.join(__dirname, '..', 'temp', 'log.txt');
const workingDir = path.join(process.cwd(), '..');

export default class ProjectController extends Controller {
  public async info() {
    const { ctx } = this;
    try {
      // check if package.json exists and dependency correct
      const packagePath = path.join(workingDir, 'package.json');
      const result = {
        init: false,
        data: {},
      };
      if (fs.existsSync(packagePath)) {
        const pipcookPluginPathExternal =
          await glob(path.join(workingDir, 'node_modules', '@pipcook', 'pipcook-app', 'node_modules', '@pipcook', '*', 'package.json'));
        const pipcookPluginPathInternal =
          await glob(path.join(workingDir, 'node_modules', '@pipcook', '*', 'package.json'));
        let pipcookPluginPath = pipcookPluginPathExternal.concat(pipcookPluginPathInternal);
        pipcookPluginPath = Array.from(new Set(pipcookPluginPath));
        let pipPlugins = pipcookPluginPath.map(pluginPath => {
          const pluginJson = fs.readJSONSync(pluginPath);
          const splitName = pluginJson.name.split('-');
          const type = splitName[splitName.length - 2] + '-' + splitName[splitName.length - 1];
          if (PLUGIN_TYPES.includes(type)) {
            return {
              name: pluginJson.name,
              version: pluginJson.version,
              description: pluginJson.description,
              type,
            };
          }
          return null;
        });
        pipPlugins = pipPlugins.filter(e => e);
        if (pipPlugins.length > 0) {
          result.init = true;
          result.data = pipPlugins;
        }
      }
      return successRes(ctx, result);
    } catch (err) {
      return failRes(ctx, {
        msg: err.message,
      });
    }
  }


  public async init() {
    const { ctx } = this;
    try {
      fs.removeSync(LOG_PATH);
      shell.exec(`cd ${workingDir} && pipcook init &> ${LOG_PATH}`, code => {
        fs.appendFileSync(LOG_PATH, '__pipcook_exit_code:' + code);
      });
      return successRes(ctx, {});
    } catch (err) {
      return failRes(ctx, {
        msg: err.message,
      });
    }
  }

  public async pipExecResult() {
    const { ctx } = this;
    const log = fs.readFileSync(LOG_PATH);
    return successRes(ctx, { status: true, stdout: log.toString() });
  }

  public async pipeline() {
    const { ctx } = this;
    try {
      const { pluginMap } = ctx.request.body;
      const generatedCodes = generateCode(pluginMap);
      const fileName = uuidv1() + '.js';
      const filePath = path.join(__dirname, '..', 'temp', fileName);
      fs.outputFileSync(filePath, generatedCodes);

      fs.removeSync(LOG_PATH);
      shell.exec(`cd ${workingDir} && node ${filePath} &> ${LOG_PATH}`, code => {
        fs.appendFileSync(LOG_PATH, '__pipcook_exit_code:' + code);
      });

      return successRes(ctx, {});
    } catch (err) {
      console.error(err);
      return failRes(ctx, {
        msg: err.message,
      });
    }
  }
}

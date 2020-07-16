import { Context, controller, inject, provide, get, post } from 'midway';
import { successRes } from '../../utils/response';
import { PluginManager } from '../../service/plugin';
import ServerSentEmitter from '../../utils/emitter';
import Debug from 'debug';
const debug = Debug('daemon.app.plugin');

@provide()
@controller('/plugin')
export class PluginController {
  @inject()
  ctx: Context;

  @inject('pluginManager')
  pluginManager: PluginManager;

  @get('/install')
  public async install() {
    const { name, pyIndex } = this.ctx.query;
    const sse = new ServerSentEmitter(this.ctx);
    try {
      debug(`checking info: ${name}.`);
      const pkg = await this.pluginManager.fetch(name);
      sse.emit('info', pkg);

      debug(`installing ${name}.`);
      const plugin = await this.pluginManager.findOrCreateByPkg(pkg);
      try {
        await this.pluginManager.install(pkg, pyIndex);
        sse.emit('installed', pkg);
      } catch (err) {
        await this.pluginManager.deleteById(plugin.id);
        throw err;
      }
    } catch (err) {
      sse.emit('error', err?.message);
    } finally {
      sse.finish();
    }
  }

  @get('/uninstall')
  public async uninstall() {
    await this.pluginManager.uninstall(this.ctx.query.name);
    successRes(this.ctx, {});
  }

  @get('/list')
  public async list() {
    const plugins = await this.pluginManager.list({
      datatype: this.ctx.query.datatype,
      category: this.ctx.query.category
    });
    successRes(this.ctx, { data: plugins });
  }
  @get('/:id')
  public async info() {
    const plugin = await this.pluginManager.findById(this.ctx.params.id);
    successRes(this.ctx, { data: plugin });
  }
  @post('/upload')
  public async upload() {
    const fs = await this.ctx.getFileStream();
    const { pyIndex, force } = fs.fields;
    successRes(this.ctx, await this.pluginManager.installFromTarStream(fs, pyIndex, force));
  }

  private linkLog(logStream: NodeJS.ReadStream, level: 'info' | 'warn', sse: ServerSentEmitter): Promise<void> {
    return new Promise(resolve => {
      logStream.on('data', data => {
        sse.emit('log', { level, data });
      });
      logStream.on('close', resolve);
      logStream.on('error', err => {
        sse.emit('error', err.message);
      });
    });
  }

  @get('/log/:id')
  public async log() {
    const sse = new ServerSentEmitter(this.ctx);
    const log = await this.pluginManager.getInstallLog(this.ctx.params.id);
    if (!log) {
      sse.emit('error', 'no log found');
      return sse.finish();
    }
    await Promise.all([
      this.linkLog(log.stdout, 'info', sse),
      this.linkLog(log.stderr, 'warn', sse)
    ]);
    return sse.finish();
  }
}

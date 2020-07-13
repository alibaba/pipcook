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
      await this.pluginManager.install(pkg, pyIndex);
      sse.emit('installed', pkg);
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

  @post('/upload')
  public async upload() {
    const fs = await this.ctx.getFileStream();
    const id = await this.pluginManager.installFromTarStream(fs);
    successRes(this.ctx, { id });
  }

  @get('/log')
  public async log() {
    const logStream = await this.pluginManager.getInstallLogStream(this.ctx.query.id);
    const sse = new ServerSentEmitter(this.ctx);
    if (logStream) {
      await new Promise(() => {
        logStream.on('data', data => {
          sse.emit('info', data.toString());
        });
        logStream.on('end', () => {
          sse.emit('finished', undefined);
        });
        // FIXME(feely): it's not working, stream end first, then trigger the error event
        logStream.on('error', err => {
          sse.emit('error', err);
        });
      });
      sse.finish();
    } else {
      sse.emit('error', 'no log found');
      sse.finish();
    }
  }
}

import { Context, controller, inject, provide, get, post } from 'midway';
import { successRes } from '../../utils/response';
import { PluginManager } from '../../service/plugin';
import ServerSentEmitter from '../../utils/emitter';
import Debug from 'debug';
import { Readable } from 'stream';
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
    successRes(this.ctx, await this.pluginManager.installFromTarStream(fs));
  }

  private async linkLog(logStream: Readable,
    type: 'info' | 'error', sse: ServerSentEmitter): Promise<void> {
    if (logStream.readable) {
      logStream.on('data', data => {
        sse.emit(type, data.toString());
      });
      return new Promise(resolveEnd => {
        logStream.on('end', () => {
          process.nextTick(resolveEnd);
        });
        logStream.on('error', err => {
          sse.emit('fail', err.message);
          resolveEnd();
        });
      });
    } else {
      return Promise.resolve();
    }
  }
  @get('/log/:id')
  public async log() {
    const logObject = await this.pluginManager.getInstallLogStream(this.ctx.params.id);
    const sse = new ServerSentEmitter(this.ctx);
    if (logObject.logTransfroms) {
      if (logObject.finished) {
        if (logObject.error) {
          sse.emit('fail', `install plugin error: ${logObject.error.message}`);
        } else {
          sse.emit('info', 'plugin installed');
        }
      } else {
        const futures = [
          this.linkLog(logObject.logTransfroms.stdout, 'info', sse),
          this.linkLog(logObject.logTransfroms.stderr, 'error', sse)
        ];
        await Promise.all(futures);
      }
      sse.finish();
    } else {
      sse.emit('error', 'no log found');
      sse.finish();
    }
  }
}

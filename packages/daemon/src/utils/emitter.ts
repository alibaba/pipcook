import { Context } from 'midway';
import SseStream from 'ssestream';

export default class ServerSentEmitter {
  private handle: SseStream;
  private response: NodeJS.WritableStream;

  constructor(ctx: Context) {
    this.response = ctx.res as NodeJS.WritableStream;
    this.handle = new SseStream(ctx.req);
    this.handle.pipe(this.response);
    this.emit('session', 'start');
  }

  emit(event: string, data: any): boolean {
    return this.handle.write({ event, data });
  }

  finish(): void {
    this.emit('session', 'close');
    this.handle.unpipe(this.response);
  }
}

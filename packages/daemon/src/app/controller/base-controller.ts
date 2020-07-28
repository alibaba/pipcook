import { Context, inject } from 'midway';

export class BaseController {
  @inject()
  ctx: Context;

  successRes(data: any, code = 200): void {
    this.ctx.body = data;
    this.ctx.status = code;
  }

  failRes(message: string, code = 400): void {
    this.ctx.status = code;
    this.ctx.message = JSON.stringify({ message });
  }
}

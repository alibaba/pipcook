import { Context, controller, inject, provide, get } from 'midway';

@provide()
@controller('/')
export class IndexController {
  @inject()
  ctx: Context;

  @get('/')
  public async index() {
    this.ctx.redirect('/index.html');
  }
}

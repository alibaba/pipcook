import { Context, inject } from 'midway';
import { ObjectSchema } from 'joi';

export class BaseController {
  @inject()
  ctx: Context;

  /**
   * validata the data by schema
   * @param schema the schema
   * @param data the data validated
   */
  validate(schema: ObjectSchema, data: any) {
    const { error } = schema.validate(data);
    if (error) {
      throw error;
    }
  }
  /**
   * send successful response
   * @param data data returned
   * @param code success code, should be [200, 299], default is 200
   */
  success(data: any, code = 200): void {
    this.ctx.body = data;
    this.ctx.status = code;
  }

  /**
   * send failed response
   * @param message error message
   * @param code error code, default is 400
   */
  fail(message: string, code = 400): void {
    this.ctx.status = code;
    this.ctx.message = JSON.stringify({ message });
  }
}

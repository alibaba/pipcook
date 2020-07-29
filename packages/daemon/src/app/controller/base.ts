import { Context, inject } from 'midway';
import { ObjectSchema } from 'joi';
import * as createHttpError from 'http-errors';

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
      throw createHttpError(400, error.message);
    }
  }
  /**
   * send successful response, the status will be set to 204 or 200,
   * depend on if data is undefined
   * @param data data returned
   * @param status success code, should be [200, 299], default is 200
   */
  success(data?: any, status?: number): void {
    this.ctx.body = data;
    if (typeof status !== 'undefined') {
      this.ctx.status = status;
    } else {
      this.ctx.status = data ? 200 : 204;
    }
  }
}

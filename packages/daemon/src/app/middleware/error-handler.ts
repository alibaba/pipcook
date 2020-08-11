import { Context } from 'egg';
import { isHttpError } from 'http-errors';

/**
 * process all the errors which not be catched from request
 */
export default function errorHandler(): any {
  return async (ctx: Context, next: () => Promise<any>) => {
    try {
      await next();
    } catch (err) {
      // TODO(feely): should not respond the error message
      // in the production environment if the status is 500
      ctx.body = { message: err.message };
      if (isHttpError(err)) {
        ctx.status = err.status;
      } else {
        ctx.app.emit('error', err, ctx);
        ctx.status = 500;
      }
    }
  };
}

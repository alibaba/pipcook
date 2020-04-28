import { Context } from 'midway';

export function successRes(ctx: Context, data: {[key: string]: any}, code = 200) {
  ctx.body = {
    ...data,
    status: true,
  };
  ctx.status = code;
  return ctx.body;
}

export function failRes(ctx: Context, data: {[key: string]: any}, code = 400) {
  ctx.body = {
    ...data,
    status: false,
  };
  ctx.status = code;
  return ctx.body;
}

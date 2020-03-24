import { Context } from 'egg';

export function successRes(ctx: Context, data: {[key: string]: any}) {
  ctx.body = {
    ...data,
    status: true,
  };
  return ctx.body;
}

export function failRes(ctx: Context, data: {[key: string]: any}) {
  ctx.body = {
    ...data,
    status: false,
  };
  return ctx.body;
}

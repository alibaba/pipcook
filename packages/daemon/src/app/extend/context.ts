import { Context } from 'egg';
import * as HttpStatus from 'http-status';

export default {
  // extending the success function for context
  success (this: Context, data?: any, status?: number) {
    this.body = data;
    if (typeof status !== 'undefined') {
      this.status = status;
    } else {
      this.status = typeof data === 'undefined' ? HttpStatus.NO_CONTENT : HttpStatus.OK;
    }
  }
}

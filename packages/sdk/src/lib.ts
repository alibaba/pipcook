import { BaseApi } from "./base";
import { post } from "./request";
/**
 * API for lib management
 */
export class Lib extends BaseApi {
  constructor(url: string) {
    super(`${url}/lib`);
  }

  /**
   * install lib by name
   */
  /**
   * install libs by name
   * @param name lib's name
   */
  install(name: string): Promise<boolean> {
    return post(`${this.route}/${name}`);
  }
}

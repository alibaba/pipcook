declare module 'egg' {
  interface Context {
    /**
     * send successful response, the status will be set to 204 or 200,
     * depend on if data is undefined
     * @param data data returned
     * @param status success code, should be [200, 299], default is 200
     */
    success(data?: any, status?: number): void
  }
}

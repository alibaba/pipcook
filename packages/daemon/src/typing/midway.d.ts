
declare module 'egg' {
  interface Context {
    success(data?: any, status?: number): void
  }
}
  
export interface CMDHandler {
  (cmdObj: string | string[]): Promise<void>
}

export interface ServeHandler {
  (deployPath: string, port: number): Promise<void>
}

export interface PredictFunc {
  (param: any): Promise<any>
}

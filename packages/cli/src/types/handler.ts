interface CMDHandlerObjectParams {
  [key: string]: any;
}

export interface CMDHandler {
  (cmdObj: CMDHandlerObjectParams): Promise<void>;
}

export interface ServeHandler {
  (deployPath: string, port: number): Promise<void>;
}

export interface PredictFunc {
  (param: any): Promise<any>;
}

export interface StartHandler {
  (filename: string): Promise<void>;
}

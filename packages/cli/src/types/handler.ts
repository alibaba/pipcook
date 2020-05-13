import {
  PluginTypeI
} from "@pipcook/pipcook-core";

export interface CommandHandler {
  (): Promise<void>;
}

interface DatasetCommandHandlerObjectParams {
  type: string;
}

export interface DatasetCommandHandler {
  (cmdObj: DatasetCommandHandlerObjectParams): Promise<void>;
}

interface DevPluginCommandHandlerObjectParams {
  type: PluginTypeI;
  name: string;
}

export interface DevPluginCommandHandler {
  (cmdObj: DevPluginCommandHandlerObjectParams): Promise<void>;
}

interface InitCommandHandlerObjectParams {
  client: string;
  beta: boolean;
  tuna: boolean;
}

export interface InitCommandHandler {
  (cmdObj: InitCommandHandlerObjectParams): Promise<void>;
}

export interface ServeHandler {
  (deployPath: string, port: number): Promise<void>;
}

export interface PredictHandler {
  (param: any): Promise<any>;
}

export interface StartHandler {
  (filename: string): Promise<void>;
}

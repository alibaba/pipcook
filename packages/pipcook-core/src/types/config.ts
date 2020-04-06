export interface Config {
  version: string;
}

export interface RunConfigParam {
  package: string;
  params: any;
}

export interface RunConfigI {
  plugins: {
    dataCollect?: RunConfigParam,
    dataAccess?: RunConfigParam,
    dataProcess?: RunConfigParam,
    modelLoad?: RunConfigParam,
    modelTrain?: RunConfigParam,
    modelEvaluate?: RunConfigParam,
    modelDeploy?: RunConfigParam,
  }
}
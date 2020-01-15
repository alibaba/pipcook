import {ModelTrainType, PipcookModel, UniformGeneralSampleData, ArgsType} from '@pipcook/pipcook-core';
import {Python} from '@pipcook/pipcook-python-node';

const imageDetectronModelTrain: ModelTrainType = async (data: UniformGeneralSampleData, model: PipcookModel, args?: ArgsType): Promise<PipcookModel> => {
  const trainer = model.model;
  await Python.scope('detectron', (python: any) => {
    const currentTrainer = python.runRaw(Python.convert(trainer));
    currentTrainer.train();
  });

  const result: PipcookModel = {
    model: trainer,
    type: model.type,
    inputShape: model.inputShape,
    outputShape: model.outputShape,
    metrics: model.metrics || [],
    inputType: 'float32',
    outputType: 'int32',
    save: model.save,
    predict: model.predict,
    modelName: model.modelName,
    config: model.config,
    extraParams: model.extraParams
  }
  return result;
}

export default imageDetectronModelTrain;
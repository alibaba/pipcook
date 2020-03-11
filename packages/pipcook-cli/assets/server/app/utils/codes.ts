import { PluginMapI } from './types';

export function generateCode(pluginMap: PluginMapI) {
  const fistLetterUpper = str => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const transformName = str => {
    return str.replace('-', '_');
  };

  let codes = `const {DataCollect, DataAccess, DataProcess, ModelLoad, ModelTrain, 
    ModelEvaluate, PipcookRunner, ModelDeploy} = require('@pipcook/pipcook-core');`;
  for (const key in pluginMap) {
    codes += `\n const ${transformName(key)}Plugin = require('${pluginMap[key].name}').default \n`;
  }


  let functionCode = '';
  const processors: string[] = [];
  for (const key in pluginMap) {
    const nameSplilt = key.split('-');
    const processorType = `${nameSplilt[0]}${fistLetterUpper(nameSplilt[1])}`;
    processors.push(processorType);
    functionCode += `\n const ${processorType} = ${fistLetterUpper(processorType)}(${transformName(key)}Plugin, ${JSON.stringify(pluginMap[key].params)}); \n`;
  }

  functionCode += `const runner = new PipcookRunner();
  runner.run([${processors.toString()}])`;

  codes += `async function startPipeline() {${functionCode}} \n startPipeline();`;

  return codes;
}

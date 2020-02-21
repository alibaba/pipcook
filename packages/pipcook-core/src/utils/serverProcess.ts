import * as path from "path";
const fs = require("fs-extra");
import {PipcookComponentResult} from '../types/component';
import {DataAccessType, DataProcessType} from '../types/plugins';
import {createAnnotationFile, createAnnotationFromJson} from './publicUtils';
import {IMAGE_CLASSIFICATION, OBJECT_DETECTION} from '../constants/model';
import {transformCsv} from '../utils/publicUtils';

export async function processImageClassification(data: any, dataAccess: PipcookComponentResult, 
  dataProcess: PipcookComponentResult, type: 'image classification' | 'object detection') {
  // all image will be stored to a temporary directory
  const trainDataPath = path.join(process.cwd(), '.temp');
  try {
    data.forEach((dataImage: any) => {
      const fileName = `image-${Date.now()}.jpg`;
      fs.outputFileSync(path.join(trainDataPath, fileName), dataImage, {encoding: 'base64'});
      if (type === IMAGE_CLASSIFICATION) {
        createAnnotationFile(trainDataPath, fileName, trainDataPath, 'no');
      } else if (type === OBJECT_DETECTION) {
        const annotation = {
          annotation: {
            filename: [fileName],
            folder: [trainDataPath],
            object: [
              {
                name: ['temp'],
                bndbox: [
                  {
                    xmin: [0],
                    ymin: [0],
                    xmax: [0],
                    ymax: [0]
                  } 
                ]
              }
            ]
          }
        };
        createAnnotationFromJson(trainDataPath, annotation);
      }
    });

    let result: any = {
      trainDataPath,
    }
    const dataAccessPlugin = dataAccess.plugin as DataAccessType;
    result = await dataAccessPlugin(result, dataAccess.params);
    if (dataProcess) {
      const dataProcessPlugin = dataProcess.plugin as DataProcessType;
      result = await dataProcessPlugin(result, dataProcess.params);
    }
    result = result.trainData.map((e: any) => {
      return e.xs;
    })
    result = result.batch(data.length);
    result = result.take(1);
    return result;
  } catch(err) {
    console.error(err);
  }finally {
    fs.removeSync(trainDataPath);
  }
}

export async function processTextClassification(data: any, dataAccess: PipcookComponentResult, 
  dataProcess: PipcookComponentResult) {
    const trainDataPath = path.join(process.cwd(), '.temp');
    try {
      const trainData: string[] = [];
      data.forEach((dataText: any) => {
        trainData.push(`${transformCsv(dataText)},temp`);
      });
      const finalText = trainData.join('\n');
      fs.outputFileSync(path.join(trainDataPath, 'train.csv'), finalText);
  
      let result: any = {
        trainDataPath: path.join(trainDataPath, 'train.csv'),
      }
      const dataAccessPlugin = dataAccess.plugin as DataAccessType;
      result = await dataAccessPlugin(result, dataAccess.params);
      if (dataProcess) {
        const dataProcessPlugin = dataProcess.plugin as DataProcessType;
        result = await dataProcessPlugin(result, dataProcess.params);
      }
      result = result.trainData.map((e: any) => {
        return e.xs;
      })
      result = result.take(1);
      return result;
    }finally {
      fs.removeSync(trainDataPath);
    }
  }

export function serverStatic(fastify: any) {
  fastify.register(require('fastify-static'), {
    root: path.join(__dirname, '..' ,'assets', 'build'),
  });
  console.log('here')
  fastify.get('/index', function (req: any, reply: any) {
    reply.sendFile('index.html') 
  })
}
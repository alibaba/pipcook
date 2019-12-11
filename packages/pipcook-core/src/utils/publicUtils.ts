/**
 * @file This file contains useful utils for plugin developers.
 */

import * as path from 'path';

const fs = require('fs-extra');
const xml2js = require('xml2js');
const DecompressZip = require('decompress-zip');
const _cliProgress = require('cli-progress');
const request = require('request');

/**
 * This function is used to create annotation file for image claasifiaction.  PASCOL VOC format.
 * For more info, you can check the sources codes of plugin: @pipcook/pipcook-plugins-image-class-data-collect
 * @param annotationDir : annotation directory
 * @param filename : iamge file name
 * @param url : image path
 * @param category : image classification category name
 */
export function createAnnotationFile(annotationDir: string, filename: string, url: string, category: string) {
  fs.ensureDirSync(annotationDir);
  const json = {
    annotation: {
      filename: [filename],
      folder: [url],
      object: [
        {
          name: [category]
        }
      ]
    }
  };
  const fileNameSplit = filename.split('.');
  filename = fileNameSplit.slice(0, fileNameSplit.length - 1).join('.');

  const xml = (new xml2js.Builder()).buildObject(json);
  fs.outputFileSync(path.join(annotationDir, `${filename}.xml`), xml);
}

/**
 * create annotation file for object detection. PASCOL VOC format.
 * For more info, you can check the sources codes of plugin: @pipcook/pipcook-plugins-image-detection-data-collect
 * @param annotationDir : annotation directory
 * @param json : json file that will be filled into xml
 */
export function createAnnotationFromJson(annotationDir: string, json: any) {
  let filename = json.annotation.filename[0];
  const fileNameSplit = filename.split('.');
  filename = fileNameSplit.slice(0, fileNameSplit.length - 1).join('.');

  const xml = (new xml2js.Builder()).buildObject(json);
  fs.outputFileSync(path.join(annotationDir, `${filename}.xml`), xml);
}

/**
 * parse the xml file and read into json data
 * filename: file path of xml file
 */
export async function parseAnnotation(filename: string) {
  const fileContent = fs.readFileSync(filename);
  const parser = new xml2js.Parser();
  const jsonData = await parser.parseStringPromise(fileContent);
  return jsonData;
}

/**
 * download the file and stored in specified directory
 * @param url: url of the file
 * @param: full path of file that will be stored
 */
export function downloadZip(url: string, fileName: string) {
  fs.ensureFileSync(fileName)
  return new Promise((resolve, reject) => {
    const bar1 = new _cliProgress.SingleBar({}, _cliProgress.Presets.shades_classic);
    const file = fs.createWriteStream(fileName);
    let receivedBytes = 0
    request.get(url)
      .on('response', (response: any) => {
        const totalBytes = response.headers['content-length'];
        bar1.start(totalBytes, 0);
      })
      .on('data', (chunk: any) => {
        receivedBytes += chunk.length;
        bar1.update(receivedBytes);
      })
      .pipe(file)
      .on('error', (err: Error) => {
          fs.unlink(fileName);
          bar1.stop();
          reject(err);
      });
  
    file.on('finish', () => {
      bar1.stop();
      resolve();
    });
  
    file.on('error', (err: Error) => {
      fs.unlink(fileName);
      bar1.stop();
      reject(err);
    });
  })
}

/**
 * unzip compressed data
 * @param filePath : path of zip
 * @param targetPath : target full path
 */
export function unZipData(filePath: string, targetPath: string) {
  return new Promise((resolve, reject) => {
    const unzipper = new DecompressZip(filePath);
    const bar1 = new _cliProgress.SingleBar({}, _cliProgress.Presets.shades_classic);
    unzipper.on('error', function (err: Error) {
      bar1.stop();
      reject(err);
    });
    
    unzipper.on('extract', function () {
      bar1.stop();
      resolve();
    });
    
    unzipper.on('progress', function (fileIndex: number, fileCount: number) {
      if (fileIndex === 1) {
        bar1.start(fileCount, 0);
      }
      bar1.update(fileIndex);
    });
    
    unzipper.extract({
        path: targetPath,
        filter: function (file: any) {
            return file.type !== "SymbolicLink";
        }
    });
  })
}

/**
 * get pipcook dataset directory path
 */
export function getDatasetDir() {
  return path.join(process.cwd(), '.pipcook-log', 'datasets')
}

/**
 * get pipcook model path
 */

export function getModelDir(modelId: string) {
  return path.join(process.cwd(), '.pipcook-log', 'models', `pipcook-pipeline-${modelId}-model`);
}

/**
 * get pipcook log's sample data's metadata according to modelId
 */

export function getMetadata(modelId: string) {
  const id = modelId.split('-')[0];
  const json = require(path.join(process.cwd(), '.pipcook-log', 'logs', `pipcook-pipeline-${id}.json`));
  return json && json.latestSampleData && json.latestSampleData.metaData
}

export function transformCsv(text: string){
  if (text.includes(',')){
    if (text.includes('"')) {
      let newText = '';
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '"') {
          newText += `""`;
        } else {
          newText += text[i];
        }  
      }
      text = newText;
    } 
    text = `"${text}"`;
  }
  return text;
}
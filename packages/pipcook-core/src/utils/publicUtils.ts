/**
 * @file This file contains useful utils for plugin developers.
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import _cliProgress from 'cli-progress';
import * as tf from '@tensorflow/tfjs-node-gpu';
import Jimp from 'jimp';


const xml2js = require('xml2js');
const request = require('request');
const si = require('systeminformation');
const targz = require('targz');
const extract = require('extract-zip');

/**
 * This function is used to create annotation file for image claasifiaction.  PASCOL VOC format.
 * For more info, you can check the sources codes of plugin: @pipcook/pipcook-plugins-image-class-data-collect
 * @param annotationDir : annotation directory
 * @param filename : iamge file name
 * @param url : image path
 * @param category : image classification category name
 */
export function createAnnotationFile(annotationDir: string, filename: string, url: string, category: string) {
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
export function download(url: string, fileName: string) {
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

export function compressTarFile(sourcePath: string, targetPath: string) {
  return new Promise((resolve, reject) => {
      targz.compress({
        src: sourcePath,
        dest: targetPath
      }, (err: Error) => {
          if(err) {
              reject(err);
          } else {
              resolve();
          }
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
    extract(filePath, {dir: targetPath}, function (err: Error) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * get pipcook model path
 */

export function getModelDir(modelId: string) {
  return path.join(process.cwd(), 'pipcook-output', modelId, 'model');
}

/**
 * get pipcook log's sample data's metadata according to modelId
 */

export function getMetadata(modelId: string) {
  const json = require(path.join(process.cwd(), 'pipcook-output', modelId, `log.json`));
  return json && json.latestSampleData && json.latestSampleData.metaData
}

/**
 * transform a string to its csv suitable format
 * @param text the text to be converted
 */
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

/**
 * converter between PASCOL VOC format and COCO data format
 * @param files : paths of xml files
 * @param targetPath target output path
 */
export async function convertPascol2CocoFileOutput(files: string[], targetPath: string) {
  const cocoJson: any = {
    info: {
      "description":"dataset generated by pipcook",
      "url":"http:\/\/mscoco.org",
      "version":"1.0","year":2014,
      "contributor":"Microsoft COCO group",
      "date_created":"2015-01-27 09:11:52.357475"
    },
    images: [],
    licenses: [{
      "url":"http:\/\/creativecommons.org\/licenses\/by-nc-sa\/2.0\/",
      "id":1,
      "name":"Attribution-NonCommercial-ShareAlike License"
    }],
    annotations: [],
    categories: []
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const xmlJson = await parseAnnotation(file);
    const imageItem: any = {
      license: 1,
      file_name: xmlJson.annotation.filename[0],
      coco_url: xmlJson.annotation.folder[0],
      id: i+1
    }
    if (xmlJson.annotation.size && xmlJson.annotation.size[0]) {
      imageItem.width = parseInt(xmlJson.annotation.size[0].width[0]);
      imageItem.height = parseInt(xmlJson.annotation.size[0].height[0]);
    }
    cocoJson.images.push(imageItem);
    if (!(xmlJson.annotation && xmlJson.annotation.object && xmlJson.annotation.object.length > 0)) {
      continue;
    }
    xmlJson.annotation.object.forEach((item: any) => {
      const name = item.name[0];
      const category = cocoJson.categories.find((e: any) => e.name === name);
      let id;
      if (category) {
        id = category.id;
      } else {
        id = cocoJson.categories.length + 1;
        cocoJson.categories.push({
          id,
          name,
          supercategory: name
        });
      }
      const cocoItem: any = {
        id: cocoJson.annotations.length + 1,
        image_id: i,
        category_id: id,
        segmentation: [],
        iscrowd: 0,
      };
      if (item.bndbox && item.bndbox[0]) {
        const width = parseInt(item.bndbox[0].xmax[0]) - parseInt(item.bndbox[0].xmin[0]);
        const height = parseInt(item.bndbox[0].ymax[0]) - parseInt(item.bndbox[0].ymin[0]);
        cocoItem.bbox = [parseInt(item.bndbox[0].xmin[0]), parseInt(item.bndbox[0].ymin[0]), width, height];
        cocoItem.area = Number(width * height);
      }
      cocoJson.annotations.push(cocoItem);
    })
  }
  fs.outputJSONSync(targetPath, cocoJson)
}

/**
 * return that current system is:
 * mac / linux / windows / other
 */
export function getOsInfo() {
  return new Promise((resolve, reject) => {
    si.osInfo((info: any, err: Error) => {
      if (err) {
        reject(err);
        return;
      }
      if (info.platform === 'linux') {
        resolve('linux');
      } else if (info.platform === 'win32') {
        resolve('windows');
      } else if (info.platform === 'darwin') {
        resolve('mac');
      } else {
        resolve('other');
      }
    });
  })
}

export async function base64ToTfjsTensor(input: string[]) {
  const imageArray: number[] = [];
  for (let index = 0; index < input.length; index++) {
    let img = await Jimp.read(Buffer.from(input[index], 'base64'));
    img = img.resize(256, 256);
    await img.writeAsync('imageclass.jpg');
    for (let i = 0; i < 256; i++) {
      for (let j = 0; j < 256; j++) {
        imageArray.push(Jimp.intToRGBA(img.getPixelColor(i, j)).r);
        imageArray.push(Jimp.intToRGBA(img.getPixelColor(i, j)).g);
        imageArray.push(Jimp.intToRGBA(img.getPixelColor(i, j)).b);
      }
    }
  }

  const tensorRes = tf.tensor4d(imageArray);
  return tensorRes;
}

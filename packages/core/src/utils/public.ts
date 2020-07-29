import * as url from 'url';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs-extra';
import { generate } from 'shortid';
import _cliProgress from 'cli-progress';
import { PIPCOOK_LOGS, PIPCOOK_TMPDIR } from '../constants/other';

const xml2js = require('xml2js');
const request = require('request');
const si = require('systeminformation');
const targz = require('targz');
const extract = require('extract-zip');

const compressAsync = promisify(targz.compress);
const extractAsync = promisify(extract);
/**
 * This function is used to create annotation file for image claasifiaction.  PASCOL VOC format.
 * For more info, you can check the sources codes of plugin: @pipcook/pipcook-plugins-image-class-data-collect
 * @param annotationDir : annotation directory
 * @param filename : image file name
 * @param url : image path
 * @param category : image classification category name
 */
export async function createAnnotationFile(annotationDir: string, filename: string, url: string, category: string): Promise<void> {
  const json = {
    annotation: {
      filename: [ filename ],
      folder: [ url ],
      object: [
        {
          name: [ category ]
        }
      ]
    }
  };
  const fileNameSplit = filename.split('.');
  filename = fileNameSplit.slice(0, fileNameSplit.length - 1).join('.');

  const xml = (new xml2js.Builder()).buildObject(json);
  await fs.outputFile(path.join(annotationDir, `${filename}.xml`), xml);
}

/**
 * create annotation file for object detection. PASCOL VOC format.
 * For more info, you can check the sources codes of plugin: @pipcook/pipcook-plugins-image-detection-data-collect
 * @param annotationDir : annotation directory
 * @param json : json file that will be filled into xml
 */
export async function createAnnotationFromJson(annotationDir: string, json: any): Promise<void> {
  let filename = json.annotation.filename[0];
  const fileNameSplit = filename.split('.');
  filename = fileNameSplit.slice(0, fileNameSplit.length - 1).join('.');
  const xml = (new xml2js.Builder()).buildObject(json);
  await fs.outputFile(path.join(annotationDir, `${filename}.xml`), xml);
}

/**
 * parse the xml file and read into json data
 * filename: file path of xml file
 */
export async function parseAnnotation(filename: string): Promise<any> {
  const fileContent = await fs.readFile(filename);
  const parser = new xml2js.Parser();
  const jsonData = await parser.parseStringPromise(fileContent);
  return jsonData;
}

/**
 * download the file and stored in specified directory
 * @param url: url of the file
 * @param: full path of file that will be stored
 */
export async function download(url: string, fileName: string): Promise<void> {
  await fs.ensureFile(fileName);
  return new Promise((resolve, reject) => {
    const bar1 = new _cliProgress.SingleBar({}, _cliProgress.Presets.shades_classic);
    const file = fs.createWriteStream(fileName);
    let receivedBytes = 0;
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
  });
}

/**
 * Download the dataset from specific URL and extract to a generated path as the returned value.
 * @param resUrl the resource url, support http://, https://, file:///.
 */
export async function downloadAndExtractTo(resUrl: string): Promise<string> {
  const filename = resUrl.split(path.sep)[resUrl.split(path.sep).length - 1];
  const extname = path.extname(filename);

  const { protocol, pathname } = url.parse(resUrl);
  const destPath = path.join(PIPCOOK_TMPDIR, generate());
  await fs.ensureDir(destPath);
  const pkgName = path.join(destPath, filename);

  if (protocol === 'file:' && extname !== '.zip') {
    await fs.copy(pathname, destPath);
    return destPath;
  }
  if (protocol === 'http:' || protocol === 'https:') {
    await download(resUrl, pkgName);
  } else if (protocol === 'file:') {
    await fs.copyFile(pathname, pkgName);
  }
  if (extname === '.zip') {
    await unZipData(pkgName, destPath);
    await fs.remove(pkgName);
  } else {
    return pkgName;
  }
  return destPath;
}

export function compressTarFile(sourcePath: string, targetPath: string): Promise<void> {
  return compressAsync({ src: sourcePath, dest: targetPath });
}

/**
 * unzip compressed data
 * @param filePath : path of zip
 * @param targetPath : target full path
 */
export function unZipData(filePath: string, targetPath: string): Promise<void> {
  return extractAsync(filePath, { dir: targetPath });
}

/**
 * get pipcook model path
 */

export function getModelDir(jobId: string): string {
  return path.join(PIPCOOK_LOGS, jobId, 'model');
}

/**
 * get pipcook log's sample data's metadata according to modelId
 */

export function getMetadata(jobId: string): any {
  const json = require(path.join(PIPCOOK_LOGS, jobId, `log.json`));
  return json && json.metadata;
}

/**
 * transform a string to its csv suitable format
 * @param text the text to be converted
 */
export function transformCsv(text: string): string {
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
export async function convertPascal2CocoFileOutput(files: string[], targetPath: string): Promise<void> {
  const cocoJson: any = {
    info: {
      "description": "dataset generated by pipcook",
      "url": "http:\/\/mscoco.org",
      "version": "1.0", "year":2014,
      "contributor": "Microsoft COCO group",
      "date_created": "2015-01-27 09:11:52.357475"
    },
    images: [],
    licenses: [
      {
        "url": "http:\/\/creativecommons.org\/licenses\/by-nc-sa\/2.0\/",
        "id": 1,
        "name": "Attribution-NonCommercial-ShareAlike License"
      }
    ],
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
      id: i + 1
    };
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
        image_id: i + 1,
        category_id: id,
        iscrowd: Number((item.iscrowd && item.iscrowd[0])) || 0
      };

      if (item.segmentation && item.segmentation[0]) {
        if (item.segmentation[0].counts) {
          cocoItem.segmentation = {
            counts: item.segmentation[0].counts[0],
            size: [
              Number(item.segmentation[0].size[0]),
              Number(item.segmentation[0].size[1])
            ]
          };
        } else if (item.segmentation[0].polygon) {
          cocoItem.segmentation = item.segmentation[0].polygon[0];
        }
      }

      if (item.bndbox && item.bndbox[0]) {
        const width = parseInt(item.bndbox[0].xmax[0]) - parseInt(item.bndbox[0].xmin[0]);
        const height = parseInt(item.bndbox[0].ymax[0]) - parseInt(item.bndbox[0].ymin[0]);
        cocoItem.bbox = [ parseInt(item.bndbox[0].xmin[0]), parseInt(item.bndbox[0].ymin[0]), width, height ];
        cocoItem.area = Number(width * height);
      }
      cocoJson.annotations.push(cocoItem);
    });
  }
  await fs.outputJSON(targetPath, cocoJson);
}

/**
 * return that current system is:
 * mac / linux / windows / other
 */
export function getOsInfo(): Promise<string> {
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
  });
}

/**
 * Shuffles array in place. ES6 version. This method is based on Fisher-Yates shuffle algorithm
 * @param array An array containing the items.
 */
export function shuffle(array: any[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ array[i], array[j] ] = [ array[j], array[i] ];
  }
}

/**
 * @file For plugin to collect test classification data
 */
import {DataCollectType, unZipData, ArgsType, download} from '@pipcook/pipcook-core';
import * as path from 'path';
import * as assert from 'assert';

/**
 * collect csv data
 */
const textClassDataCollect: DataCollectType = async (args: ArgsType): Promise<void> => {
  let {
    url='',
    dataDir
  } = args;

  assert.ok(url, 'Please specify a url of zip of your data');

  const fileName = url.split(path.sep)[url.split(path.sep).length - 1];
  const extention = fileName.split('.');

  assert.ok(extention[extention.length - 1] === 'zip', 'The dataset provided should be a zip file');

  if (/^file:\/\/.*/.test(url)) {
    url = url.substring(7);
  } else {
    const targetPath = path.join(dataDir, 'temp.zip');
    console.log('downloading dataset ...')
    await download(url, targetPath);
    url = targetPath;
  }

  console.log('unzip and collecting data...');
  await unZipData(url, dataDir);
}

export default textClassDataCollect;





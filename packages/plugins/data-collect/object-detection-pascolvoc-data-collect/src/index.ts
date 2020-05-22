import { ArgsType, DataCollectType } from '@pipcook/pipcook-core';
import { unZipData, download } from '@pipcook/utils';
import * as path from 'path';
import * as assert from 'assert';
import * as fs from 'fs-extra';

const imageDetectionDataCollect: DataCollectType = async (args: ArgsType): Promise<void> => {
  let {
    url = '',
    dataDir
  } = args;

  assert.ok(url, 'Please specify a url of zip of your dataset');

  const fileName = url.split(path.sep)[url.split(path.sep).length - 1];
  const extention = fileName.split('.');

  assert.ok(extention[extention.length - 1] === 'zip', 'The dataset provided should be a zip file');

  let isDownload = false;
  if (/^file:\/\/.*/.test(url)) {
    url = url.substring(7);
  } else {
    const targetPath = path.join(dataDir, 'temp.zip');
    console.log('downloading dataset ...');
    await download(url, targetPath);
    url = targetPath;
    isDownload = true;
  }

  console.log('unzip and collecting data...');
  await unZipData(url, dataDir);

  if (isDownload) {
    fs.removeSync(url);
  }
};

export default imageDetectionDataCollect;

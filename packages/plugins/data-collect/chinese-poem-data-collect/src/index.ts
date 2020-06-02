import { DataCollectType, ArgsType } from '@pipcook/pipcook-core';
import request from 'request-promise';
import * as assert from 'assert';
import * as fs from 'fs-extra';

/**
 * collect peom
 */
const collectData: DataCollectType = async (args: ArgsType): Promise<void> => {
  const { url, dataDir } = args;
  assert.ok(url, 'Please specify a url of zip of your data');

  const resp = JSON.parse(await request(url));
  let lines = [];

  for (const { paragraphs } of resp) {
    const line = paragraphs.join('');
    lines.push(line);
  }

  // TODO(Yorkie): remove it when this gets done
  await fs.ensureDir(dataDir);
  await fs.writeFile(`${dataDir}/input.txt`, lines.join('\n'), 'utf8');
};

export default collectData;

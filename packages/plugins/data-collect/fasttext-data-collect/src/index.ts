import { DataCollectType, ArgsType, download } from '@pipcook/pipcook-core';
import { PassThrough } from 'stream';
import tar from 'tar-stream';
import byline from 'byline';
import { createUnzip } from 'zlib';
import { createReadStream, createWriteStream } from 'fs';

async function extract(src: string, outputDir: string, trainNum: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const extractor = tar.extract();
    extractor.on('finish', resolve);
    extractor.on('error', reject);
    extractor.on('entry', (headers: tar.Headers, entry: PassThrough, next: () => void) => {
      if (headers.name.endsWith('stackexchange.txt')) {
        let linenum = 0;
        const trainCsv = createWriteStream(`${outputDir}/train.csv`);
        const testCsv = createWriteStream(`${outputDir}/test.csv`);
        const lineStream = byline.createStream(entry);
        lineStream.on('data', (line) => {
          line = line.toString('utf8').replace(/([.\!?,'/()])/g, (x: string) => ` ${x} `).toLowerCase();
          if (linenum++ < trainNum) {
            trainCsv.write(line + '\n');
          } else {
            testCsv.write(line + '\n');
          }
        });
        entry.on('end', () => {
          trainCsv.end();
          testCsv.end();
        });
      }
      entry.on('end', next);
      entry.resume();
    });
    createReadStream(src).pipe(createUnzip()).pipe(extractor);
  });
}

const fasttextDataCollect: DataCollectType = async (args: ArgsType): Promise<void> => {
  const {
    url = 'https://dl.fbaipublicfiles.com/fasttext/data/cooking.stackexchange.tar.gz',
    trainNum = 12404,
    dataDir
  } = args;

  const datasetPathname = `${dataDir}/dataset.tar.gz`;
  await download(url, datasetPathname);
  await extract(datasetPathname, dataDir, trainNum);
};

export default fasttextDataCollect;

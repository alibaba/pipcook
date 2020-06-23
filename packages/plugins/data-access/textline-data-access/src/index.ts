import { ArgsType, CsvDataLoader, CsvDataset, CsvSample, DataAccessType, Sample } from '@pipcook/pipcook-core';
import * as fs from 'fs-extra';

class TextlineLoader implements CsvDataLoader {
  records: CsvSample[];
  charset: string[];
  maxLineLength: number;

  constructor(lines: string[], maxLineLength: number) {
    this.charset = [];
    this.maxLineLength = maxLineLength;
    const inputSeqs = [] as Array<number[]>;

    for (const line of lines) {
      for (const char of line) {
        this.charset.push(char);
      }
    }

    for (const line of lines) {
      for (let i = 2; i <= line.length; i++) {
        const seq = new Array(this.maxLineLength).fill(0) as number[];
        for (let j = 0; j < i; j++) {
          seq[seq.length - i + j] = this.charset.indexOf(line[j]);
        }
        inputSeqs.push(seq);
      }
    }
    console.info(`input seqs is ready: ${inputSeqs.length}.`);

    this.records = inputSeqs.map((inputSeq) => {
      const sample = {
        data: inputSeq.slice(0, -1),
        label: inputSeq.slice(-1)[0]
      } as CsvSample;
      return sample;
    });
  }
  async len() {
    return this.records.length;
  }
  async getItem(id: number) {
    return this.records[id];
  }
}

const textlineAccess: DataAccessType = async (args: ArgsType): Promise<CsvDataset> => {
  const { dataDir, trainSet = 200 } = args;
  const lines = (await fs.readFile(`${dataDir}/input.txt`, 'utf8')).split('\n');
  
  // find the max line length.
  let maxLineLength = 0;
  for (const line of lines) {
    if (line.length > maxLineLength) {
      maxLineLength = line.length;
    }
  }

  const trainLoader = new TextlineLoader(lines.slice(0, trainSet), maxLineLength);
  const testLoader = new TextlineLoader(lines.slice(trainSet, trainSet + 200), maxLineLength);
  return {
    trainLoader: trainLoader,
    trainCsvPath: `${dataDir}/input.txt`,
    testLoader: testLoader,
    testCsvPath: `${dataDir}/test.txt`,
    validationCsvPath: `${dataDir}/validate.txt`,
    validationResult: {
      result: true
    },
    dataStatistics: [],
    metadata: {
      feature: {
        names: []
      },
      labelMap: trainLoader.charset,
      maxLineLength: trainLoader.maxLineLength
    }
  };
};

export default textlineAccess;

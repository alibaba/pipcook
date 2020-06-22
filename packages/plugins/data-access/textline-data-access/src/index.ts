import { ArgsType, CsvDataLoader, CsvDataset, CsvSample, DataAccessType, Sample } from '@pipcook/pipcook-core';
import * as fs from 'fs-extra';

class TextlineLoader implements CsvDataLoader {
  records: CsvSample[];
  charset: string[];
  maxLineLength: number;

  constructor(lines: string[]) {
    const charset = [] as string[];
    const inputSeqs = [] as Array<number[]>;
    let maxLineLength = 0;

    for (const line of lines) {
      if (line.length > maxLineLength) {
        maxLineLength = line.length;
      }
      for (const char of line) {
        charset.push(char);
      }
    }
    console.info(`charset is ready: ${charset.length} chars.`);

    for (const line of lines) {
      for (let i = 2; i <= line.length; i++) {
        const seq = new Array(maxLineLength).fill(0) as number[];
        for (let j = 0; j < i; j++) {
          seq[seq.length - i + j] = charset.indexOf(line[j]);
        }
        inputSeqs.push(seq);
      }
    }
    console.info(`input seqs is ready: ${inputSeqs.length}.`);

    this.charset = charset;
    this.maxLineLength = maxLineLength;
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
  const { dataDir } = args;
  const lines = (await fs.readFile(`${dataDir}/input.txt`, 'utf8')).split('\n').slice(0, 200);
  const loader = new TextlineLoader(lines);

  return {
    trainLoader: loader,
    trainCsvPath: `${dataDir}/input.txt`,
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
      labelMap: loader.charset,
      maxLineLength: loader.maxLineLength
    }
  };
};

export default textlineAccess;

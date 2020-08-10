import { ArgsType, CsvDataLoader, CsvDataset, CsvSample, DataAccessType } from '@pipcook/pipcook-core';
import * as fs from 'fs-extra';

class TextlineLoader extends CsvDataLoader {
  records: CsvSample[];
  charset: string[];
  maxLineLength: number;

  constructor(lines: string[], maxLineLength: number) {
    super();
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

    this.records = inputSeqs.map((inputSeq) => {
      const sample = {
        data: inputSeq.slice(0, -1),
        label: inputSeq.slice(-1)[0]
      } as CsvSample;
      return sample;
    });
  }

  async len(): Promise<number>{
    return this.records.length;
  }
  async getItem(id: number): Promise<CsvSample>{
    return this.records[id];
  }
  async setItem(id: number, sample: CsvSample): Promise<void>{
    this.records[id] = sample;
  }
}

const textlineAccess: DataAccessType = async (args: ArgsType): Promise<CsvDataset> => {
  const { dataDir, trainRange = [ 0, 200 ], testRange = [ 200, 400 ] } = args;
  const lines = (await fs.readFile(`${dataDir}/input.txt`, 'utf8')).split('\n');

  // find the max line length.
  let maxLineLength = 0;
  for (const line of lines) {
    if (line.length > maxLineLength) {
      maxLineLength = line.length;
    }
  }

  const trainLoader = new TextlineLoader(lines.slice(...trainRange), maxLineLength);
  const testLoader = new TextlineLoader(lines.slice(...testRange), maxLineLength);
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

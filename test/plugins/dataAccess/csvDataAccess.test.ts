import textClassDataAccess from '../../../packages/plugins/data-access/csv-data-access';
import * as path from 'path';

const ASSET = path.join(path.resolve(__dirname, "../../"), "assets")

interface IRecord {
  label: string,
  data: {
    input: string
  }
}

describe('csv-data-access', () => {
  it('csv-data-access', async () => {
    const res = await textClassDataAccess({
      dataDir: path.join(ASSET, 'CSVSample'),
      labelColumn: "output"
    });

    expect(res.trainLoader).toBeDefined();
    res.trainLoader.records.forEach((record: IRecord, idx: number) => {
      expect(record.label).toBe((idx+1)+"");
      expect(record.data.input).toBe((idx+1)+"");
    })
    expect(res.metadata.feature.names).toEqual(['input'])
  });
});
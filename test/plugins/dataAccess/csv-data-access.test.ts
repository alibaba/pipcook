import textClassDataCollect from '../../../packages/plugins/data-collect/csv-data-collect';
import * as path from 'path'

describe('csv-data-collect', () => {
  it('csv-data-collect', async () => {
    await textClassDataCollect({
      url: "http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip",
      dataDir:  path.join(__dirname, 'test', 'plugins', 'dataAccess', 'temp')
    });
  });
});
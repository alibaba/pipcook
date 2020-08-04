import textClassDataCollect from '../../../packages/plugins/data-collect/csv-data-collect'
import * as path from 'path';
import * as fs from 'fs-extra';

describe('csv-data-collect-test',  () => {
  it("test", async () => {
    await textClassDataCollect({
      url: "http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip",
      dataDir:  path.join(__dirname, 'temp')
    });
  
    const trainExist = await fs.pathExists(path.join(__dirname, 'temp', 'train.csv'));
    
    expect(trainExist).toBe(true);
  });

  afterEach(async () => {
    await fs.remove(path.join(__dirname, "temp"))
  });

});
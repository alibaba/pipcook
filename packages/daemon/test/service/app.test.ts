import { app, assert, mm } from 'midway-mock/bootstrap';
import { AppService } from '../../src/service/app';
import * as sinon from 'sinon';
import * as helper from '../../src/runner/helper';
import { join } from 'path';
import * as core from '@pipcook/pipcook-core';
import * as AppCompiler from '@pipcook/app';
import * as fs from 'fs-extra';

describe('test the app service', () => {
  afterEach(() => {
    sinon.restore();
    mm.restore();
  })
  it('#should compile app', async () => {
    const mockPath = join(__dirname, 'test-app');
    const appService: AppService = await app.applicationContext.getAsync<AppService>('appService');
    app.mockClassFunction('pipelineService', 'createPipeline', async (config: any) => {
      assert.deepEqual({}, config);
      return {
        id: 'mockPipelineId'
      }
    });
    const mockGenerateId = sinon.stub(core, 'generateId').returns('mockId');
    const mockParseConfig = sinon.stub(helper, 'parseConfig').resolves({} as any);
    const pipelineConfig = { mockConfig: 'configValue' };
    const mockCompile = sinon.stub(AppCompiler, 'compile').resolves({
      pipelines: [
        {
          id: 'mockId',
          signature: 'signature',
          config: pipelineConfig,
          namespace: {
            module: 'vision',
            method: 'method',
          },
          jobId: 'jobId'
        }
      ],
      nlpReferences: [],
      visionReferences: []
    });
    sinon.replace(core.constants, 'PIPCOOK_APP', mockPath);
    const mockFsReadFile = sinon.stub(fs, 'readFile').resolves('mockFileContent' as any);
    const result = await appService.compile('mock source');
    assert.ok(mockCompile.calledOnceWithExactly(join(core.constants.PIPCOOK_APP, 'mockId', 'src/index.ts'), join(core.constants.PIPCOOK_APP, 'mockId', 'tsconfig.json')), 'compile check');
    assert.deepEqual(result, {
      pipelines: [
        {
          id: 'mockPipelineId',
          signature: 'signature',
          config: pipelineConfig,
          namespace: {
            module: 'vision',
            method: 'method',
          },
          jobId: 'jobId'
        }
      ],
      executableSource: 'mockFileContent'
    }, 'compile result check');
    assert.ok(mockFsReadFile.calledOnceWith(join(core.constants.PIPCOOK_APP, 'mockId' + '/dist/index.js')), 'fs read check');
    assert.ok(mockParseConfig.calledOnceWithExactly(pipelineConfig as any), 'parse config check');
    assert.ok(mockGenerateId.calledOnce, 'generate id check');
    await fs.remove(mockPath);
  });
});

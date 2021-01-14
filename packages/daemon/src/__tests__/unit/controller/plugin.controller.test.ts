
import { sinon, StubbedInstanceWithSinonAccessor, createStubInstance } from '@loopback/testlab';
import test from 'ava';
import { Request, Response } from '@loopback/rest';
import { PluginController } from '../../../controllers';
import { Plugin } from '../../../models';
import { PluginRepository } from '../../../repositories';
import { PluginService, TraceService, PluginTraceResp } from '../../../services';
import * as utils from '../../../utils';
import * as multer from 'multer';

function initPluginController(): {
  pluginService: StubbedInstanceWithSinonAccessor<PluginService>,
  traceService: StubbedInstanceWithSinonAccessor<TraceService>,
  pluginRepository: StubbedInstanceWithSinonAccessor<PluginRepository>,
  pluginController: PluginController
  } {
  const pluginRepository = createStubInstance<PluginRepository>(PluginRepository);
  const pluginService = createStubInstance<PluginService>(PluginService);
  const traceService = createStubInstance<TraceService>(TraceService);
  const pluginController = new PluginController(pluginService, traceService, pluginRepository);
  return {
    pluginRepository,
    pluginService,
    traceService,
    pluginController
  };
}
const mockPluginJson = { name: 'mockPluginName', version: '1.0.0' };

test.serial.afterEach(() => sinon.restore());

test('find an existing plugin', async (t) => {
  const { pluginRepository, pluginController } = initPluginController();
  const mockPlugin = new Plugin({ id: '123', name: 'Pen', version: 'pen', sourceFrom: '' });

  pluginRepository.stubs.findById.resolves(mockPlugin);

  const detail = await pluginController.findById('123');

  t.deepEqual(detail, mockPlugin);
  t.true(pluginRepository.stubs.findById.calledOnce);
});

test('find a nonexistent plugin', async (t) => {
  const { pluginRepository, pluginController } = initPluginController();

  pluginRepository.stubs.findById.rejects(new TypeError('mock error'));

  await t.throwsAsync(pluginController.findById('nonexsitentId'), { instanceOf: TypeError, message: 'mock error' }, 'should throw error');
  t.true(pluginRepository.stubs.findById.calledOnce);
});

test('create plugin', async (t) => {
  const { pluginService, pluginController } = initPluginController();
  const mockPlugin = { name: 'mockPluginName' };

  pluginService.stubs.installByName.resolves(mockPlugin as any);

  const plugin = await pluginController.create({ name: 'mockName', pyIndex: 'mockPyIndex' });

  t.deepEqual(plugin, mockPlugin);
  t.true(pluginService.stubs.installByName.calledOnce);
});

test('reinstall plugin', async (t) => {
  const { pluginService, pluginController } = initPluginController();

  pluginService.stubs.installByName.resolves(mockPluginJson as any);

  const plugin = await pluginController.reInstallByName({ name: 'mockName', pyIndex: 'mockPyIndex' });

  t.deepEqual(plugin, mockPluginJson);
  t.true(pluginService.stubs.installByName.calledOnce);
});

test('remove plugin by id', async (t) => {
  const { pluginService, pluginRepository, pluginController } = initPluginController();

  pluginService.stubs.uninstall.resolves();
  pluginRepository.stubs.findById.resolves(mockPluginJson as any);

  await pluginController.deleteById('mockId');

  t.true(pluginService.stubs.uninstall.calledOnceWith(mockPluginJson as any));
  t.true(pluginRepository.stubs.findById.calledOnceWith('mockId'));
});

test.todo('remove plugin by id but no entity found');

test('remove all plugins', async (t) => {
  const { pluginRepository, pluginService, pluginController } = initPluginController();
  const plugins = [ mockPluginJson as any ];

  pluginService.stubs.uninstall.resolves();
  pluginRepository.stubs.find.resolves(plugins);

  await t.notThrowsAsync(pluginController.removeAll(), 'remove all plugins');

  t.deepEqual(pluginService.stubs.uninstall.args, [ [ plugins ] ]);
  t.true(pluginRepository.stubs.find.calledOnceWith());
});

test('get plugin meta data from registy by name', async (t) => {
  const { pluginService, pluginController } = initPluginController();
  const pluginPackage = { name : 'mockPackageName' };

  pluginService.stubs.fetch.resolves(pluginPackage as any);

  await t.notThrowsAsync(pluginController.getMetadata('packageName'), 'get plugin meta data by name');

  t.deepEqual(pluginService.stubs.fetch.args, [ [ 'packageName' ] ]);
});

test('get plugin meta data by id', async (t) => {
  const { pluginRepository, pluginService, pluginController } = initPluginController();
  const pluginPackage = { name : 'mockPackageName' };

  pluginRepository.stubs.findById.resolves(mockPluginJson as any);
  pluginService.stubs.fetch.resolves(pluginPackage as any);

  await t.notThrowsAsync(pluginController.getMetadataById('mockId'), 'get plugin meata data by id');

  t.deepEqual(pluginService.stubs.fetch.args, [ [ `${mockPluginJson.name}@${mockPluginJson.version}` ] ]);
  t.deepEqual(pluginRepository.stubs.findById.args, [ [ 'mockId' ] ]);
});

test('list plugins', async (t) => {
  const { pluginRepository, pluginController } = initPluginController();
  const fileter = { where: { name: 'mockName' } };
  pluginRepository.stubs.find.resolves(mockPluginJson as any);

  await t.notThrowsAsync(pluginController.list(fileter), 'list plugins');

  t.deepEqual(pluginRepository.stubs.find.args, [ [ fileter ] ]);
});

async function uploadPlugin(t: any, isError: boolean): Promise<void> {
  const { pluginRepository, pluginController, pluginService } = initPluginController();
  pluginRepository.stubs.find.resolves(mockPluginJson as any);
  const mockTracer = createStubInstance<PluginTraceResp>(PluginTraceResp);
  const installError = new Error('mock error');
  mockTracer.stubs.traceId = 'mockTraceId';
  if (isError) {
    pluginService.stubs.installFromTarStream.rejects(installError);
  } else {
    pluginService.stubs.installFromTarStream.resolves(mockTracer);
  }
  const stubReq = { body: { pyIndex: 'mockIndex' } } as Request;
  const stubResp = {} as Response;
  const stubRealUpload = sinon.stub().callsFake((req: Request, resp: Response, cb: (err: Error | null) => void) => {
    t.is(req, stubReq, 'req is not current');
    t.is(resp, stubResp, 'resp is not current');
    setTimeout(() => { isError ? cb(installError) : cb(null); }, 10);
  });
  const stubSigle = sinon.stub().callsFake((field: string) => {
    t.is(field, 'file', 'field name should be \'file\'');
    return stubRealUpload;
  });
  sinon.stub(utils, 'multer').callsFake((opts: Record<string, multer.StorageEngine>) => {
    const storage = opts.storage;
    process.nextTick(() => {
      storage._handleFile(stubReq, {} as any, sinon.stub());
      storage._removeFile(stubReq, {} as any, sinon.stub());
    });
    return {
      single: stubSigle
    };
  });
  if (isError) {
    await t.throwsAsync(pluginController.uploadPackage(stubReq, stubResp), { instanceOf: Error, message: 'mock error' });
  } else {
    t.deepEqual(await pluginController.uploadPackage(stubReq, stubResp), mockTracer);
  }
}

test.serial('upload plugin', async (t) => {
  await uploadPlugin(t, false);
});

test.serial('upload plugin but error thrown', async (t) => {
  await uploadPlugin(t, true);
});


import {
  createStubInstance,
  sinon
} from '@loopback/testlab';
import test from 'ava';
import { PluginController } from '../../controllers';
import { Plugin } from '../../models';
import { PluginRepository } from '../../repositories';
import { PluginService } from '../../services';

// 'PluginController (unit)
// test.beforeEach(t => {
// });

test('find an existing plugin', async t => {
  const repository = createStubInstance(PluginRepository);
  const service = createStubInstance(PluginService);
  const controller = new PluginController(service, repository);
  const mockPluginEntity = {id: '123', name: 'Pen', version: 'pen', sourceFrom: ''};
  const mockPlugin = new Plugin(mockPluginEntity);
  repository.stubs.findById.resolves(mockPlugin);

  const details = await controller.findById('123');

  t.deepEqual(details.toJSON(), mockPluginEntity);
  sinon.assert.calledWithMatch(repository.stubs.findById, '123');
  t.pass();
});
test('find a nonexistent plugin', async t => {
  const repository = createStubInstance(PluginRepository);
  const service = createStubInstance(PluginService);
  const controller = new PluginController(service, repository);
  repository.stubs.findById.resolves(undefined);

  const details = await controller.findById('nonexsitentId');

  t.is(details, undefined);
  sinon.assert.calledWithMatch(repository.stubs.findById, 'nonexsitentId');
});

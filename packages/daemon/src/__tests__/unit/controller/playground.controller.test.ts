import { sinon } from '@loopback/testlab';
import test from 'ava';
import { PlayGroundController } from '../../../controllers';
import axios from 'axios';

test('list version info', async (t) => {
  const playgroundController = new PlayGroundController();
  const mockResp = { data: { mock: 'mockData' } };
  sinon.stub(axios, 'get').resolves(mockResp as any);
  const manifest = await playgroundController.getModelManifest('mockModel', 'mockName');
  t.deepEqual(manifest, mockResp.data, 'data not current');
});

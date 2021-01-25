import { createStubInstance, StubbedInstanceWithSinonAccessor } from '@loopback/testlab';
import test from 'ava';
import { LibController } from '../../../controllers';
import { LibService } from '../../../services';

function initLibController(): {
  libService: StubbedInstanceWithSinonAccessor<LibService>,
  libController: LibController
  } {
  const libService = createStubInstance<LibService>(LibService);
  const libController = new LibController(libService);
  return {
    libService,
    libController
  };
}

test('install lib', async (t) => {
  const { libService, libController } = initLibController();
  libService.stubs.installByName.resolves(true);
  const ret = await libController.install('tvm');
  t.deepEqual(ret, true, 'lib installed successfully');
});

import { PipcookClient } from '../src';

describe('test job apis', () => {
  const pipcook = new PipcookClient();

  it('should call get output download url by id', async () => {
    expect(pipcook.job.getOutputDownloadURL('myid'))
      .toBe(`${pipcook.endpoint}/job/myid/output`);
  });

});

import {
  sinon,
  Client, createRestAppClient,
  givenHttpServerConfig
} from '@loopback/testlab';
import { DaemonApplication } from '../../application';

export async function setupApplication(): Promise<AppWithClient> {
  const restConfig = givenHttpServerConfig({
    // Customize the server configuration here.
    // Empty values (undefined, '') will be ignored by the helper.
    //
    // host: process.env.HOST,
    // port: +process.env.PORT,
  });

  const app = new DaemonApplication({
    rest: restConfig
  });

  await app.boot();
  await app.start();

  const client = createRestAppClient(app);

  return { app, client };
}

export interface AppWithClient {
  app: DaemonApplication;
  client: Client;
}

export function testConstructor<T>(ctor: { new(...args: any[]): T }, ...args: any[]): (t: any) => void {
  const test = (t: any) => {
    const obj = new ctor(...args);
    t.truthy(obj);
  };
  return test;
}

export function mockFunctionFromGetter(obj: any, funcName: string): sinon.SinonStub {
  const mockFunc = sinon.stub();
  const getter = sinon.stub().returns(mockFunc);
  sinon.stub(obj, funcName).get(getter);
  return mockFunc;
}

import * as sinon from 'sinon';

export function mockFunctionFromGetter(obj: any, funcName: string): sinon.SinonStub {
  const mockFunc = sinon.stub();
  const getter = sinon.stub().returns(mockFunc);
  sinon.stub(obj, funcName).get(getter);
  return mockFunc;
}

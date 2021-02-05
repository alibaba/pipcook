import {
  sinon
} from '@loopback/testlab';
import test from 'ava';
import { mockFunctionFromGetter } from '../../__helpers__';
import * as boa from '@pipcook/boa';
import * as keras from '../../../convertor/keras';
import * as utils from '../../../convertor/utils';
import * as core from '@pipcook/pipcook-core';
import * as fs from 'fs-extra';
import { GenerateOptions } from '../../../services';


test.serial.afterEach(() => {
  sinon.restore();
});

test.serial('test initTVM', async (t) => {

  const boaBuiltins = {
    dict: () => null,
    len: () => 4,
    open: () => {
      return {
        write: () => null
      };
    }
  };

  const mockImport = sinon.stub(boa, 'builtins').returns(boaBuiltins);

  const load_model = () => {
    return {
      layers: [ {
        input_shape: [ [ 0, 1, 2, 3 ] ]
      } ]
    };
  };

  const mockKerasMethods = {
    load_model
  };

  const mockRelayFrontMethods = {
    from_keras: () => {
      return [ 'mod', 'params' ];
    }
  };

  const mockRelayBuildMethod = () => {
    const lib = {
      save: () => null
    };
    return [ 'graph', lib, 'param' ];
  };

  const mockInit = sinon.stub(utils, 'initTVM').returns({
    relay: {
      frontend: mockRelayFrontMethods,
      build: mockRelayBuildMethod,
      save_param_dict: () => null
    },
    emcc: {
      create_tvmjs_wasm: () => null
    },
    keras: {
      models: mockKerasMethods
    }
  });

  const mockWriteFile = sinon.stub(fs, 'writeFile').resolves(1);
  const mockReadFile = sinon.stub(fs, 'readFile').resolves();
  const mockWriteJson = sinon.stub(fs, 'writeJSON').resolves();
  const mockCopy = sinon.stub(fs, 'copy').resolves();
  const mockOutputJSON = sinon.stub(fs, 'outputJSON').resolves();
  const mockDownload = mockFunctionFromGetter(core, 'download').resolves();

  const mockGenerateOptions: GenerateOptions = {
    modelPath: "test"
  } as GenerateOptions;

  await keras.keras2wasm("test", {}, mockGenerateOptions);

  t.true(mockImport.called, 'import should be called');
  t.true(mockInit.called, 'initTVM should be called');
  t.true(mockWriteFile.called, 'writeFile should be called');
  t.true(mockReadFile.called, 'readFile should be called');
  t.true(mockWriteJson.called, 'writeJSON should be called');
  t.true(mockCopy.called, 'copy should be called');
  t.true(mockOutputJSON.called, 'outputJSON should be called');
  t.true(mockDownload.called, 'download should be called');
});

import {
  UniDataset, ModelDeployType, UniModel
} from '@pipcook/pipcook-core';
import fastify from 'fastify';

const server = fastify({ logger: false });

const localModelDeploy: ModelDeployType = async (
  data: UniDataset, model: UniModel
): Promise<any> => {
  server.post('/', async (req) => {
    const result = await model.predict(req.body.data);
    return {
      result
    };
  });

  const start = async () => {
    try {
      await server.listen(7687);
      console.log('local server is starting. Please send POST HTTP request to 7687');
    } catch (err) {
      process.exit(1);
    }
  };
  start();
};

export default localModelDeploy;

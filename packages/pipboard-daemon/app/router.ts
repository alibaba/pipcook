import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;

  // logs
  router.get('/log/logs', controller.log.logs);
  router.get('/log/datasets', controller.log.datasets);
  router.get('/log/models', controller.log.models);

  // showcase
  router.post('/showcase/mnist', controller.showcase.mnist);
  router.post('/showcase/asset-classification', controller.showcase.assetClassification);

  // pipeline CRUD
  router.post('/pipeline', controller.pipeline.create);
};

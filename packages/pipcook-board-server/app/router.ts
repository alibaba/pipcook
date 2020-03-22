import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;

  // router.get('/', controller.home.index);

  // project
  router.get('/project/info', controller.project.info);
  router.post('/project/init', controller.project.init);
  router.post('/project/pipeline', controller.project.pipeline);

  // logs
  router.get('/log/logs', controller.log.logs);
  router.get('/log/datasets', controller.log.datasets);
  router.get('/log/models', controller.log.models);

  // showcase
  router.post('/showcase/mnist', controller.showcase.mnist);
  router.post('/showcase/asset-classification', controller.showcase.assetClassification);

  // customized UI
  router.get('/ui-plugin/list', controller.uiPlugin.list);
};

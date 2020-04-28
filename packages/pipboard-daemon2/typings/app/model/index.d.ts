// This file is created by egg-ts-helper@1.25.7
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportPipeline from '../../../app/model/pipeline';

declare module 'egg' {
  interface IModel {
    Pipeline: ReturnType<typeof ExportPipeline>;
  }
}

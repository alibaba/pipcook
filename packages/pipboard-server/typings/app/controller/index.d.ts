// This file is created by egg-ts-helper@1.25.7
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportHome from '../../../app/controller/home';
import ExportLog from '../../../app/controller/log';
import ExportShowcase from '../../../app/controller/showcase';

declare module 'egg' {
  interface IController {
    home: ExportHome;
    log: ExportLog;
    showcase: ExportShowcase;
  }
}

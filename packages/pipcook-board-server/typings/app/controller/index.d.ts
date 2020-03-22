// This file is created by egg-ts-helper@1.25.7
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportHome from '../../../app/controller/home';
import ExportLog from '../../../app/controller/log';
import ExportProject from '../../../app/controller/project';
import ExportShowcase from '../../../app/controller/showcase';
import ExportUiPlugin from '../../../app/controller/uiPlugin';

declare module 'egg' {
  interface IController {
    home: ExportHome;
    log: ExportLog;
    project: ExportProject;
    showcase: ExportShowcase;
    uiPlugin: ExportUiPlugin;
  }
}

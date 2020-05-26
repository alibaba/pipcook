import * as fs from 'fs-extra';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import { PIPCOOK_STORAGE } from './constants';

sqlite3.verbose();

function initSqlite() {
  fs.ensureDirSync(path.dirname(PIPCOOK_STORAGE));
  new sqlite3.Database(PIPCOOK_STORAGE, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
}

initSqlite();

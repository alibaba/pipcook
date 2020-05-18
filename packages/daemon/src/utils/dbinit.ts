import * as fs from 'fs-extra';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import * as os from 'os';

sqlite3.verbose();

const dbHome = path.join(os.homedir(), '.pipcook', 'db');
fs.ensureDirSync(dbHome);
new sqlite3.Database(path.join(dbHome, 'pipcook.db'), sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);

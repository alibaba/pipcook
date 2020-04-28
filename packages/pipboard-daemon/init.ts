import * as fs from 'fs-extra';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';

sqlite3.verbose();

fs.ensureDirSync(path.join(__dirname, 'db'));
new sqlite3.Database(path.join(__dirname, 'db', 'pipcook.db'), sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
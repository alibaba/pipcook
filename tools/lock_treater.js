const fs = require('fs');
const path = require('path');

const target = path.resolve(__dirname, '../', 'yarn.lock');
const content = fs.readFileSync(target).toString();
const newContent = content.replace('https://registry.npm.taobao.org', 'https://registry.yarnpkg.com/');

fs.writeFileSync(target, newContent);
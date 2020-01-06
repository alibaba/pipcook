const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// doc dir
const docDir = path.join(__dirname, 'doc');
fs.removeSync(docDir);

// repo
const zh_repo = 'znzce0/in8hih'
const en_repo = 'znzce0/lpqk9b'

// toc
const zh_toc = `https://www.yuque.com/api/v2/repos/${zh_repo}/toc`
const en_toc = `https://www.yuque.com/api/v2/repos/${en_repo}/toc`
 

async function generateZh() {
  const tocRes = await axios.get(zh_toc);
  const tocs = tocRes.data.data;
  for (let i = 0; i < tocs.length; i++) {
    const toc = tocs[i];
    const markdown = await axios.get(`https://www.yuque.com/api/v2/repos/${zh_repo}/docs/${toc.slug}?raw=1`);
    const markdownContent = markdown.data.data.body;
    const title = toc.title.replace(/\//g, '-');
    fs.outputFileSync(path.join(docDir, `${title}-zh.md`), markdownContent);
  }
}

generateZh();
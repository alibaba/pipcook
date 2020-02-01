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
 

async function generate(lang) {
  let tocRes;
  if (lang === 'zh') {
    tocRes = await axios.get(zh_toc);
  } else {
    tocRes = await axios.get(en_toc);
  }
  const tocs = tocRes.data.data;
  const tocMap = {};
  tocs.forEach((toc) => {
    tocMap[toc.slug] = toc.title.replace(/\//g, '-') + (lang === 'zh' ? '-zh' : '-en');
  })
  for (let i = 0; i < tocs.length; i++) {
    const toc = tocs[i];
    const markdown = 
      await axios.get(`https://www.yuque.com/api/v2/repos/${lang === 'zh' ? zh_repo : en_repo}/docs/${toc.slug}?raw=1`);
    let markdownContent = markdown.data.data.body;
    markdownContent = `# ${markdown.data.data.title}\n\n` + markdownContent;
    let regex;
    if (lang === 'zh') {
      regex = /(https:\/\/www.yuque.com\/znzce0\/in8hih\/*)/g
    } else {
      regex = /(https:\/\/www.yuque.com\/znzce0\/lpqk9b\/*)/g
    }
    while(result = regex.exec(markdownContent)) {
      const rest = markdownContent.substr(result.index)
      const leftIndex = rest.indexOf(')');
      const wholeUrl = markdownContent.substr(result.index, leftIndex);
      const splitArray  = wholeUrl.split(path.sep);
      const slug = splitArray[splitArray.length - 1]
      markdownContent = markdownContent.replace(new RegExp(wholeUrl, 'g'), `https://alibaba.github.io/pipcook/doc/${encodeURIComponent(tocMap[slug])}`)
    }
    const title = toc.title.replace(/\//g, '-');
    markdownContent = markdownContent.replace(/```typescript/g, '```');
    fs.outputFileSync(path.join(docDir, `${title}-${lang}.md`), markdownContent);
  }
}

generate('zh');
generate('en')
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const token = '';

// doc dir
const docDir = path.join(__dirname, 'doc');
fs.removeSync(docDir);

// repo
const zh_repo = 'znzce0/in8hih'
const en_repo = 'znzce0/lpqk9b'

// toc
const zh_toc = `https://www.yuque.com/api/v2/repos/${zh_repo}/toc`
const en_toc = `https://www.yuque.com/api/v2/repos/${en_repo}/toc`

replaceList = [
  {
    origin: 'https://cdn.nlark.com/yuque/0/2020/png/654014/1580538912983-a2f236f1-454f-4d17-be67-a1c88fb42f1a.png#align=left&display=inline&height=179&name=image.png&originHeight=358&originWidth=2006&size=219404&status=done&style=none&width=1003',
    newText: 'https://img.alicdn.com/tfs/TB1aaMbuKL2gK0jSZFmXXc7iXXa-2006-358.png'
  },
  {
    origin: 'https://cdn.nlark.com/yuque/0/2020/png/654014/1580538946503-934368a7-9e53-403e-9299-9d6bfa707493.png#align=left&display=inline&height=184&name=image.png&originHeight=424&originWidth=828&size=176376&status=done&style=none&width=359',
    newText: 'https://img.alicdn.com/tfs/TB1CWz7uGL7gK0jSZFBXXXZZpXa-718-368.png'
  },
  {
    origin: 'https://cdn.nlark.com/yuque/0/2020/png/654014/1580539222364-f158701f-c01a-48e5-b744-49aee210f91b.png#align=left&display=inline&height=238&name=image.png&originHeight=700&originWidth=1454&size=516382&status=done&style=none&width=494',
    newText: 'https://img.alicdn.com/tfs/TB14EscuG61gK0jSZFlXXXDKFXa-988-476.png'
  },
  {
    origin: 'https://cdn.nlark.com/yuque/0/2020/png/654014/1580539335805-714c29f9-9901-4bca-b16f-b98dde74a608.png#align=left&display=inline&height=86&name=image.png&originHeight=172&originWidth=1318&size=131735&status=done&style=none&width=659',
    newText: 'https://img.alicdn.com/tfs/TB1IP69uKT2gK0jSZFvXXXnFXXa-1318-172.png'
  },
  {
    origin: 'https://cdn.nlark.com/yuque/0/2020/png/654014/1578400785510-71c4832c-aca3-4709-92d4-fb7f048fb6ff.png#align=left&display=inline&height=969&originHeight=969&originWidth=2323&size=0&status=done&style=none&width=2323',
    newText: 'https://img.alicdn.com/tfs/TB1eZrDtkT2gK0jSZFkXXcIQFXa-2323-969.png'
  }
]
 

async function generate(lang) {
  let tocRes;
  if (lang === 'zh') {
    tocRes = await axios.get(zh_toc, {
      headers: {
        'X-Auth-Token': token
      }
    });
  } else {
    tocRes = await axios.get(en_toc,  {
      headers: {
        'X-Auth-Token': token
      }
    });
  }
  const tocs = tocRes.data.data;
  const tocMap = {};
  tocs.forEach((toc) => {
    tocMap[toc.slug] = toc.title.replace(/\//g, '-') + (lang === 'zh' ? '-zh' : '-en');
  })
  for (let i = 0; i < tocs.length; i++) {
    const toc = tocs[i];
    console.log(toc.slug, toc.title);
    const markdown = 
      await axios.get(`https://www.yuque.com/api/v2/repos/${lang === 'zh' ? zh_repo : en_repo}/docs/${toc.slug}?raw=1`, {
        headers: {
          'X-Auth-Token': token
        }
      });
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

    replaceList.forEach((text) => {
      markdownContent = markdownContent.replace(new RegExp(text.origin, 'g'), text.newText);
    })
    
    fs.outputFileSync(path.join(docDir, `${title}-${lang}.md`), markdownContent);
  }
}

generate('zh');
generate('en')
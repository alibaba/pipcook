

const { readdirSync } = require('fs');
const { extname, join } = require('path');

const lookupDirs = [
  `${__dirname}/delegators`,
  // TODO(Yorkie): allow custom dir?
];
const preloadDelegators = {
  'default': () => Object.create({}),
};

function load(customLookupDirs=false) {
  return (customLookupDirs || lookupDirs)
    .reduce(_loadDirNoCache, preloadDelegators);
}

function notJS(filename) {
  return extname(filename) === '.js'
}

function bySequence(a, b) {
  return a.list.length < b.list.length ? -1 : 1;
}

function assignOn(map, f) {
  const absPath = join(f.root, f.filename);
  const fn = require(absPath);
  if (typeof fn === 'function') {
    if (f.list.length === 1) {
      map[f.list[0]] = fn;
    } else {
      const end = f.list.length - 1;
      const typename = f.list[end];
      const module = f.list.slice(0, end).join('.');
      if (!map[module]) {
        map[module] = {};
      }
      map[module][typename] = fn;
    }
  }
  return map;
}

function _loadDirNoCache(delegators, root) {
  return readdirSync(root)
    .filter(notJS)
    .map(filename => {
      return {
        root,
        filename,
        list: filename.replace(/\.js/, '').split('.'),
      };
    })
    .sort(bySequence)
    .reduce(assignOn, delegators);
}

exports.load = load;

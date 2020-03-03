import {PythonObject} from '../types/python-object';

/**
 * conversion of basic types and objects
 * For basic types: we will have some rules, 
 * for more info, could check here: https://github.com/alibaba/pipcook/wiki/%E6%83%B3%E8%A6%81%E4%BD%BF%E7%94%A8python%EF%BC%9F
 * 
 */
export function conversion(target: any) {
  if (target.__pipcook__args) {
    let args = '';
    for (const key in target) {
      if (key !== '__pipcook__args') {
        args += `${key}=${conversion(target[key])},`
      }
    }
    return args.slice(0, args.length - 1);
  } else if(typeof target === 'number') {
    return target;
  } else if ((typeof target === 'string' || target instanceof String)) {
    return '"' + target + '"';
  } else if (typeof target === 'boolean') {
    if (target) {
      return 'True'
    } else {
      return 'False'
    }
  } else if (target === null || target=== undefined) {
    return 'None'
  } else if (target.__pipcook__identifier) {
    return target.__pipcook__identifier;
  } else if (Array.isArray(target)) {
    let result = '(';
    target.forEach((item: any) => {
      result += `${conversion(item)},`;
    })
    result = result.slice(0, result.length - 1);
    result += ')';
    return result;
  } else {
    return JSON.stringify(target)
  }
}

/**
 * create the proxy object to represent python object. 
 * This can change the behavious of get and set and function call of objects so that 
 * we can tranlate related codes to python codes.
 * @param object : objected to be proxyed
 * @param statements : current python statements to be executed
 */
function createProxy(object: any, statements: string[]) {
  const p: any = new Proxy(object, {
    get(target, key) {
      if (key === 'then' || typeof key !== 'string' || key === '__pipcook__identifier' 
        || key === 'inspect' || key === 'prototype' || key === 'constructor' 
        || key === 'call' || key === 'toString' || key === 'name' || key === '__pipcook__args') {
        return target[key];
      }
      const identifier = 'id_' + Date.now() + parseInt(String(Math.random() * 100000));
      if (isNaN(Number(String(key)))) {
        statements.push(`${identifier} = ${target.__pipcook__identifier}.${String(key)}`);
      } else {
        statements.push(`${identifier} = ${target.__pipcook__identifier}[${String(key)}]`);
      }
      
      return getObject(identifier, statements);
    },
    set(target, prop, value){
      if (typeof prop !== 'string') {
        target[prop] = value;
      } else {
        statements.push(`${target.__pipcook__identifier}.${prop.toString()} = ${conversion(value)}`);
      }
      return true;
    },
    apply: function(target, thisArg, argumentsList) {
      const identifier = 'id_' + Date.now() + parseInt(String(Math.random() * 100000));
      const argumentElements = argumentsList.map((ele: any) => conversion(ele));
      statements.push(`${identifier} = ${target.__pipcook__identifier}(${argumentElements.join(',')})`);
      return getObject(identifier, statements);
    }
  });
  return p;
}

/**
 * get the proxy of Python object from id
 * @param identifier: the identifier used in python codes that linked between python and object
 */
export function getObject(identifier: string, statements: string[]): PythonObject {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const object: PythonObject = function callable() {};
  object.__pipcook__identifier = identifier;
  return createProxy(object, statements);
}

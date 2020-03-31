import * as tf from '@tensorflow/tfjs-node-gpu';
import * as fs from 'fs-extra';

import Executor from '../communication/communication';
import { getObject, conversion } from './python-helper';
import { PythonObject, InstallOptionsI } from '../types/python-object';

/**
 * get a random identifier for a PythonObject
 */
function getId() {
  return 'id_' + Date.now() + parseInt(String(Math.random() * 100000));
}

/**
 * @class main class representing a python instance.
 */
export default class Python {

  // every Python instance will be bind to a specific scope. 
  // Every scope will be bound to specific ipython kernel which has its own workspace and environment
  scope: string;

  // all python statement that will be executed in next turn
  statements: string[] = [];

  // static parameter: all Python instances currently in the runtime
  static pythons: Python[] = [];

  /**
   * 
   * @param python Python instance
   */
  static async constructPythonStatements(python: Python, user_expressions?: any) {
    const statements = python.statements;
    let codes = '';
    statements.forEach((statement: string) => {
      codes += statement + '\n';
    });
    const result = await Executor.execute(python.scope, codes, user_expressions);
    python.statements.splice(0, python.statements.length);
    return result;
  }

  /**
   * static method: bind python-node codes into some scope which is associated to one ipyhton kernel
   * @param scope scope name
   * @param callback python-node codes
   */
  static async scope(scope: string, callback: Function) {
    let python = this.pythons.find((e) => e.scope === scope);
    if (!python) {
      python = new Python();
      python.scope = scope;
      this.pythons.push(python);
    }
    await Executor.openSession(scope);
    await callback(python);
    await this.constructPythonStatements(python);
  }

  /**
   * used for named arguments
   */
  nA = (arg: any) => {
    return {
      ...arg,
      __pipcook__args: true
    }
  }

  /** */
  static exit = async (scope: string) => {
    await Executor.exit(scope);
  }

  /**
   * convert raw PythonObject into its identifier representation which is used in python kernel
   */
  static convert = (object: PythonObject) => {
    return conversion(object);
  }

  /**
   * run shell commands, same as ! operator in ipython kernel
   */
  runshell = (shell: string) => {
    this.statements.push(`!${shell}`);
  }

  /**
   * import package
   */
  import = (packageName: string) => {
    const identifier = getId();
    this.statements.push(`import ${packageName} as ${identifier}`);
    const pythonObject = getObject(identifier, this.statements);
    return pythonObject;
  }

  /**
   * install pacakge
   * @param packageName: name of package
   * @param version: version of package, default to latest
   */
  install = (packageName: string, options?: InstallOptionsI) => {
    const {
      version = '', source = ''
    } = options || {};
    this.statements.push(`!pip install ${packageName}${version ? '==' + version : ''} ${source ? ('-i ' + source) : ''}`);
  }

  /**
   * run some python built in function.
   * @param functionName: build-in function name
   * @param object: argument. now just support 1
   */
  buildin = (functionName: string, object: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${functionName}(${conversion(object)})`);
    const pythonObject = getObject(identifier, this.statements);
    return pythonObject;
  }

  /**
   * same as from ... import ... in python
   * @param packageName name of the package
   * @param importNames names to be imported
   */
  fromImport(packageName: string, importNames: string[]) {
    const objects: PythonObject[] = [];
    importNames.forEach((item: string) => {
      const identifier = getId();
      this.statements.push(`from ${packageName} import ${item} as ${identifier}`); 
      const pythonObject = getObject(identifier, this.statements);
      objects.push(pythonObject);
    })
    return objects;
  }

  /**
   * create python number
   */
  createNumber = (number: number) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${number}`); 
    const pythonObject = getObject(identifier, this.statements);
    return pythonObject;
  }

  /**
   * create python string
   */
  createString = (string: string, isRaw = false) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${isRaw ? 'r' : ''}'${string}'`);
    const pythonObject = getObject(identifier, this.statements);
    return pythonObject;
  }

  /**
   * create python boolean type
   */
  createBoolean = (value: boolean) => {
    const identifier = getId();
    if (value) {
      this.statements.push(`${identifier} = True`);
    } else {
      this.statements.push(`${identifier} = False`);
    }
    
    const pythonObject = getObject(identifier, this.statements);
    return pythonObject;
  }

  /**
   * create python none
   */
  createNone = () => {
    const identifier = getId();
    this.statements.push(`${identifier} = None`);
    const pythonObject = getObject(identifier, this.statements);
    return pythonObject;
  }

  /**
   * create python tuple
   */
  createTuple = (value: any[]) => {
    const identifier = getId();
    const argumentElements = value.map((ele: any) => conversion(ele));
    this.statements.push(`${identifier} = (${argumentElements.join(',')})`);
    const pythonObject = getObject(identifier, this.statements);
    return pythonObject;
  }

  /**
   * create python list
   */
  createList = (value: any[]) => {
    const identifier = getId();
    const argumentElements = value.map((ele: any) => conversion(ele));
    this.statements.push(`${identifier} = [${argumentElements.join(',')}]`);
    const pythonObject = getObject(identifier, this.statements);
    return pythonObject;
  }

  /**
   * create python set
   */
  createSet = (value: any[]) => {
    const identifier = getId();
    const argumentElements = value.map((ele: any) => conversion(ele));
    this.statements.push(`${identifier} = set((${argumentElements.join(',')}))`);
    const pythonObject = getObject(identifier, this.statements);
    return pythonObject;
  }

  /**
   * create python dictionary
   */
  createDictionary = (value: any) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${JSON.stringify(value)}`);
    const pythonObject = getObject(identifier, this.statements);
    return pythonObject;
  }

  /**
   * print in python
   */
  print = (object: PythonObject) => {
    this.statements.push(`print(${conversion(object)})`);
  }

  /**
   * same as a == b in python
   */
  equal = (object1: PythonObject, object2: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${conversion(object1)} == ${conversion(object2)}`);
    return getObject(identifier, this.statements);
  }

  /**
   * same as a!=b in python
   */
  notEqual = (object1: PythonObject, object2: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${conversion(object1)} != ${conversion(object2)}`);
    return getObject(identifier, this.statements);
  }

  /**
   * same as a > b in python
   */
  larger = (object1: PythonObject, object2: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${conversion(object1)} > ${conversion(object2)}`);
    return getObject(identifier, this.statements);
  }

  /**
   * same as a < b in python
   */
  smaller = (object1: PythonObject, object2: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${conversion(object1)} < ${conversion(object2)}`);
    return getObject(identifier, this.statements);
  }

  /**
   * same as a >= b in python
   */
  largerEqual = (object1: PythonObject, object2: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${conversion(object1)} >= ${conversion(object2)}`);
    return getObject(identifier, this.statements);
  }

  /**
   * same as a <= b in python
   */
  smallerEqual = (object1: PythonObject, object2: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${conversion(object1)} <= ${conversion(object2)}`);
    return getObject(identifier, this.statements);
  }

  /**
   * same as a and b in python
   */
  and = (object1: PythonObject, object2: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${conversion(object1)} and ${conversion(object2)}`);
    return getObject(identifier, this.statements);
  }

  /**
   * same as a or b in python
   */
  or = (object1: PythonObject, object2: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${conversion(object1)} or ${conversion(object2)}`);
    return getObject(identifier, this.statements);
  }

  /**
   * same not a in python
   */
  not = (object: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = not ${conversion(object)}`);
    return getObject(identifier, this.statements);
  }

  /**
   * if statement
   * @param condition if condition
   * @param execution if body expression
   */
  if = (condition: PythonObject, execution: Function) => {
    this.statements.push(`if ${condition.__pipcook__identifier}:`);
    const statementsTemp = this.statements;
    this.statements = [];
    execution();
    const ifStatements = this.statements.map((ele: string) => '\t' + ele);
    this.statements = [ ...statementsTemp, ...ifStatements ];
  }

  /**
   * same as a + b in python
   */
  add = (object1: PythonObject, object2: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${conversion(object1)} + ${conversion(object2)}`);
    return getObject(identifier, this.statements);
  }

  /**
   * same as a - b in python
   */
  minus = (object1: PythonObject, object2: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${conversion(object1)} - ${conversion(object2)}`);
    return getObject(identifier, this.statements);
  }

  /**
   * same as a * b in python
   */
  multiply = (object1: PythonObject, object2: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${conversion(object1)} * ${conversion(object2)}`);
    return getObject(identifier, this.statements);
  }

  /**
   * same as a / b in python
   */
  divide = (object1: PythonObject, object2: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${conversion(object1)} / ${conversion(object2)}`);
    return getObject(identifier, this.statements);
  }

  /**
   * same as a % b in python
   */
  mod = (object1: PythonObject, object2: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${conversion(object1)} % ${conversion(object2)}`);
    return getObject(identifier, this.statements);
  }

  /**
   * same as a ** b in python
   */
  pow = (object1: PythonObject, object2: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${conversion(object1)} ** ${conversion(object2)}`);
    return getObject(identifier, this.statements);
  }

  /**
   * same as a // b in python
   */
  floorDivide = (object1: PythonObject, object2: PythonObject) => {
    const identifier = getId();
    this.statements.push(`${identifier} = ${conversion(object1)} // ${conversion(object2)}`);
    return getObject(identifier, this.statements);
  }

  /**
   * this is for those cases where above functions does not meet user's requirements.
   * This is to run the raw python statement.
   * Please use convert method to convert PythonObject to its identifier when use this method
   */
  runRaw = (raw: string) => {
    raw = raw.replace(/\n/g, ' ');
    const identifier = getId();
    this.statements.push(`${identifier} = ${raw}`);
    return getObject(identifier, this.statements);
  }

  executePythonFile = (filePath: string) => {
    const fileContent = fs.readFileSync(filePath).toString();
    this.statements.push(fileContent);
  }

  evaluate = async (object: PythonObject) => {
    this.statements.push(`${object.__pipcook__identifier}`);
    const result: any = 
      await Python.constructPythonStatements(this, { type: `type(${object.__pipcook__identifier})`, value: `${object.__pipcook__identifier}` });
    try {
      const res = {
        type: result.type,
        value: eval(result.value)
      }
      return res;
    } catch (err) {
      return {
        type: result.type,
        value: result.value
      }
    }
  }

  createNumpyFromTf = (tensor: tf.Tensor) => {
    const identifier = getId();
    this.statements.push(`import numpy as np`);
    this.statements.push(`${identifier} = np.array(${JSON.stringify(tensor.arraySync())}, '${tensor.dtype}')`);
    return getObject(identifier, this.statements);
  }

  reconnect = async () => {
    await Python.constructPythonStatements(this);
    await Executor.closeSession(this.scope);
    await Executor.openSession(this.scope);
  }
}
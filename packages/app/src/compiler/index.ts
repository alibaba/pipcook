import { Project, ImportDeclaration, ts, Node, Identifier } from 'ts-morph';
import { runInNewContext } from 'vm';

const project = new Project({
  tsConfigFilePath: '../../tsconfig.json',
});

const script = project.getSourceFileOrThrow('src/apis/index_test.ts');
const app = script.getImportDeclarationOrThrow('./index');

script.forEachChild((node: Node<ts.Node>) => {
  if (node.getKind() === ts.SyntaxKind.VariableStatement) {
    const call2createLearnable = findCallExpression('createLearnable', node);
    const funcExpr = call2createLearnable.forEachChildAsArray()[1];
    if (funcExpr.getKind() !== ts.SyntaxKind.FunctionExpression &&
      funcExpr.getKind() !== ts.SyntaxKind.ArrowFunction) {
      throw new TypeError('createLearnable should accept the function or arrow function.');
    }
    if (!getFirstChildByKindName('AsyncKeyword', funcExpr)) {
      throw new TypeError('learnable impl function must be async function.');
    }
    if (funcExpr) {
      const params = funcExpr.getFirstChildByKind(ts.SyntaxKind.Parameter);
      const block = funcExpr.getFirstChildByKind(ts.SyntaxKind.Block);
      const paramName = params.getFirstChildByKind(ts.SyntaxKind.Identifier).getText();
      const wrapped = `
        (async function learnable() {
          ${block.getFullText()}
        })()
      `;

      // generate pipelines by pre-executing the code block.
      runInNewContext(ts.transpile(wrapped), {
        [paramName]: params.getLastChild().getText(),
        nlp: {
          classify(inputType: string) {
            console.log('nlp.classify gets called', inputType);
            // generate the nlp.classify pipeline
          }
        },
        vision: {
          classify(imgType: string) {
            console.log('vision.classify gets called', imgType);
            // generate the vision.classify pipeline
          }
        }
      });
    }
  }
});

function findCallExpression(name: string, from: Node<ts.Node>): Node<ts.Node> {
  if (from.getKind() === ts.SyntaxKind.CallExpression &&
    hasIdentifier('createLearnable', from)) {
    return from;
  }
  let found: Node<ts.Node> = null;
  from.forEachChild((node) => {
    if (found !== null) {
      return;
    }
    found = findCallExpression(name, node) || null;
  });
  return found;
}

function hasIdentifier(name: string, from: Node<ts.Node>): boolean {
  const id = from.getFirstChildByKind(ts.SyntaxKind.Identifier);
  return id.getText() === name;
}

function getFirstChildByKindName(kind: string, from: Node<ts.Node>): Node<ts.Node> {
  return from.getFirstChildByKind(ts.SyntaxKind.SyntaxList)
    .getFirstChildByKind((ts.SyntaxKind as any)[kind]);
}
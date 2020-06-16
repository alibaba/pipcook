import { Project, ts, Node } from 'ts-morph';
import { runInNewContext } from 'vm';
import { nlpGen, visionGen, PipelineGenContext } from './pipelinegen';

export { PipelineGenContext };
export function compile(pathname: string, tsconfig: string): PipelineGenContext {
  const project = new Project({ tsConfigFilePath: tsconfig });
  const script = project.getSourceFileOrThrow(pathname);
  // TODO: needs to verify if this imported the learnable.
  const app = script.getImportDeclarationOrThrow('@pipcook/app');

  // create the pipelinegen context to store the generated data.
  const pipelinegenCtx = new PipelineGenContext();

  // start walking the source.
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
          nlp: nlpGen(pipelinegenCtx),
          vision: visionGen(pipelinegenCtx)
        });
      }
    }
  });
  return pipelinegenCtx;
}

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

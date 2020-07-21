import { Project, ts, Node, Identifier } from 'ts-morph';
import { pseudoRandomBytes } from 'crypto';
import { PipelineGenContext, PipelineNode, AppModule } from './pipelinegen';

export { PipelineGenContext, PipelineNode };
export async function compile(pathname: string, tsconfig: string): Promise<PipelineGenContext> {
  const project = new Project({ tsConfigFilePath: tsconfig });
  const script = project.getSourceFileOrThrow(pathname);
  // TODO: needs to verify if this imported the learnable.
  script.getImportDeclarationOrThrow('@pipcook/app');
  // create the pipelinegen context to store the generated data.
  const pipelinegenCtx = new PipelineGenContext();

  // start walking the source.
  script.forEachChild((node: Node<ts.Node>) => {
    if (node.getKind() === ts.SyntaxKind.ImportDeclaration) {
      const imports = node
        .getFirstChildByKind(ts.SyntaxKind.ImportClause)
        .getFirstChildByKind(ts.SyntaxKind.NamedImports)
        .forEachChildAsArray();

      imports.filter((importSpecifier) => {
        const identifier = importSpecifier.getFirstChildByKind(ts.SyntaxKind.Identifier);
        const identifierText = identifier.getText();
        if (identifierText === 'nlp') {
          findReferences(identifier).forEach((node) => {
            pipelinegenCtx.nlpReferences.push(node);
          });
        } else if (identifierText === 'vision') {
          findReferences(identifier).forEach((node) => {
            pipelinegenCtx.visionReferences.push(node);
          });
        }
      });
    }

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
        getReferencesInBlock(funcExpr, pipelinegenCtx.nlpReferences)
          .forEach((ref) => createPipelineFromReference(pipelinegenCtx, 'nlp', ref));
        getReferencesInBlock(funcExpr, pipelinegenCtx.visionReferences)
          .forEach((ref) => createPipelineFromReference(pipelinegenCtx, 'vision', ref));
      }
    }
  });
  await script.save();
  await script.emit();
  return pipelinegenCtx;
}

function createPipelineFromReference(ctx: PipelineGenContext, module: AppModule, ref: Node<ts.Node>): void {
  const methodIdentifier = ref
    .getNextSiblingIfKindOrThrow(ts.SyntaxKind.DotToken)
    .getNextSiblingIfKindOrThrow(ts.SyntaxKind.Identifier);
  const name = methodIdentifier.getText();
  const signature = `${name}_${pseudoRandomBytes(4).toString('hex')}`;
  ctx.pipelines.push({
    config: require(`${__dirname}/pipelines/nlp-${name}.base.json`),
    signature,
    namespace: {
      module,
      method: name
    }
  });
  methodIdentifier.replaceWithText(signature);
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

function findReferences(id: Identifier): Node<ts.Node>[] {
  return id.findReferencesAsNodes().filter((node) => {
    const parent = node.getParent();
    if (parent.getKind() !== ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const ancestor = parent.getParent();
    if (ancestor.getKind() === ts.SyntaxKind.CallExpression &&
      ancestor.getFirstChild() === parent) {
      return true;
    }
    return false;
  });
}

function hasIdentifier(name: string, from: Node<ts.Node>): boolean {
  const id = from.getFirstChildByKind(ts.SyntaxKind.Identifier);
  return id.getText() === name;
}

function getFirstChildByKindName(kind: string, from: Node<ts.Node>): Node<ts.Node> {
  return from.getFirstChildByKind(ts.SyntaxKind.SyntaxList)
    .getFirstChildByKind((ts.SyntaxKind as any)[kind]);
}

function getReferencesInBlock(block: Node<ts.Node>, refs: Node<ts.Node>[]): Node<ts.Node>[] {
  return block.getDescendants().filter((node) => {
    for (const ref of refs) {
      if (ref === node) {
        return true;
      }
    }
  });
}

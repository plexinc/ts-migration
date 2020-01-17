import ts from "typescript";
import * as utils from "tsutils";
import { NodeWrap } from "tsutils";

const IGNORE_TEXT = "// @ts-ignore from codemod - fix me please";

// JsxElement = 260,
// JsxSelfClosingElement = 261,
// JsxOpeningElement = 262,
// JsxClosingElement = 263,
// JsxFragment = 264,
// JsxOpeningFragment = 265,
// JsxClosingFragment = 266,
// JsxAttribute = 267,
// JsxAttributes = 268,
// JsxSpreadAttribute = 269,
// JsxExpression = 270,
function findParentJSX(n: NodeWrap | undefined): [number, NodeWrap] | null {
  if (n) {
    const kind = n.kind as number;
    if (kind >= 260 && kind <= 270) {
      return [kind, n];
    }
    return findParentJSX(n.parent);
  }
  return null;
}

function getLine(diagnostic: ts.Diagnostic, position?: number) {
  const { line } = diagnostic!.file!.getLineAndCharacterOfPosition(
    position || diagnostic.start!
  );
  return line;
}

const cacheMap = new Map();

export default function insertIgnore(
  diagnostic: ts.Diagnostic,
  codeSplitByLine: string[],
  includeJSX: boolean
) {
  const convertedAST = utils.convertAst(diagnostic.file!);
  const n = utils.getWrappedNodeAtPosition(
    convertedAST.wrapped,
    diagnostic.start!
  );
  const line = getLine(diagnostic);
  const match = codeSplitByLine[line].match(/^(\s*)/);
  const prefix = match ? match[1] : '';
  const fileName = diagnostic.file!.fileName;

  if (!cacheMap.has(fileName)) {
    cacheMap.set(fileName, new Set());
  }
  if (cacheMap.get(fileName).has(line)) {
    return codeSplitByLine;
  }
  cacheMap.get(fileName).add(line);

  const isInJSX = findParentJSX(n);
  if (isInJSX && !includeJSX) {
    // Don't add ignores in JSX since it's too hard.
    return codeSplitByLine;
  }

  codeSplitByLine.splice(line, 0, prefix + IGNORE_TEXT);

  return codeSplitByLine;
}

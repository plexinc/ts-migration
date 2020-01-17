"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils = __importStar(require("tsutils"));
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
function findParentJSX(n) {
    if (n) {
        const kind = n.kind;
        if (kind >= 260 && kind <= 270) {
            return [kind, n];
        }
        return findParentJSX(n.parent);
    }
    return null;
}
function getLine(diagnostic, position) {
    const { line } = diagnostic.file.getLineAndCharacterOfPosition(position || diagnostic.start);
    return line;
}
const cacheMap = new Map();
function insertIgnore(diagnostic, codeSplitByLine, includeJSX) {
    const convertedAST = utils.convertAst(diagnostic.file);
    const n = utils.getWrappedNodeAtPosition(convertedAST.wrapped, diagnostic.start);
    const line = getLine(diagnostic);
    const match = codeSplitByLine[line].match(/^(\s*)/);
    const prefix = match ? match[1] : '';
    const fileName = diagnostic.file.fileName;
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
exports.default = insertIgnore;
//# sourceMappingURL=insertIgnore.js.map
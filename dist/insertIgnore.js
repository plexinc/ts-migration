"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils = __importStar(require("tsutils"));
const IGNORE_TEXT = "// @ts-expect-error from codemod";
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
function insertIgnore(diagnostic, codeSplitByLine, includeJSX, message) {
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
    codeSplitByLine.splice(line, 0, prefix + IGNORE_TEXT + ((message === null || message === void 0 ? void 0 : message.length) ? `: ${message}` : ''));
    return codeSplitByLine;
}
exports.default = insertIgnore;
//# sourceMappingURL=insertIgnore.js.map
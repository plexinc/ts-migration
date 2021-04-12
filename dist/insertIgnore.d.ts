import ts from "typescript";
export default function insertIgnore(diagnostic: ts.Diagnostic, codeSplitByLine: string[], includeJSX: boolean, message?: string): string[];

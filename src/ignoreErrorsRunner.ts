import { groupBy, uniqBy } from "lodash";
import { readFileSync, writeFileSync } from "fs";
import insertIgnore from "./insertIgnore";
import commit from "./commitAll";
import { getFilePath, getDiagnostics } from "./tsCompilerHelpers";
import { FilePaths } from "./cli";

const successFiles: string[] = [];
const errorFiles: string[] = [];

export default async function compile(
  paths: FilePaths,
  shouldCommit: boolean,
  includeJSX: boolean
): Promise<void> {
  const diagnostics = await getDiagnostics(paths);
  const diagnosticsWithFile = diagnostics.filter(
    d => !!d.file && !paths.exclude.some(e => d.file!.fileName.includes(e))
  );
  const diagnosticsGroupedByFile = groupBy(
    diagnosticsWithFile,
    d => d.file!.fileName
  );

  Object.keys(diagnosticsGroupedByFile).forEach(async (fileName, i, arr) => {
    if (fileName.includes('ContextManager')) {
      console.log('fileName', fileName);
      console.log('diagnosticsGroupedByFile[fileName]', diagnosticsGroupedByFile[fileName].length);
      diagnosticsGroupedByFile[fileName].forEach(d => {
        console.log('d', d.messageText, d.code);
        const position = d.file!.getLineAndCharacterOfPosition(d.start!);
        console.log('position', position);
        console.log('text', d.file!.text.substr(d.start! - 20, 40));
      });
    }

    const fileDiagnostics = uniqBy(diagnosticsGroupedByFile[fileName], d =>
      d.file!.getLineAndCharacterOfPosition(d.start!)
    ).reverse();
    console.log(
      `${i} of ${arr.length - 1}: Ignoring ${
        fileDiagnostics.length
      } ts-error(s) in ${fileName}`
    );
    try {
      const filePath = getFilePath(paths, fileDiagnostics[0]);
      let codeSplitByLine = readFileSync(filePath, "utf8").split("\n");
      fileDiagnostics.forEach((diagnostic, _errorIndex) => {
        codeSplitByLine = insertIgnore(diagnostic, codeSplitByLine, includeJSX);
      });
      const fileData = codeSplitByLine.join("\n");
      writeFileSync(filePath, fileData);
      successFiles.push(fileName);
    } catch (e) {
      console.log(e);
      errorFiles.push(fileName);
    }
  });

  if (shouldCommit) {
    await commit("[CODEMOD][refactor] Ignore errors", paths);
  }

  console.log(`${successFiles.length} files with errors ignored successfully.`);
  if (errorFiles.length) {
    console.log(`Error handling ${errorFiles.length} files:`);
    console.log(errorFiles);
  }
}

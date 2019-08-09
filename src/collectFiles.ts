import fs from "fs";
import path from "path";
import micromatch from "micromatch";
import { promisify } from "util";

import { FilePaths } from "./cli";

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

async function getFiles(dir: string): Promise<string[]> {
  const subdirs = await readdir(dir);
  const files = await Promise.all(
    subdirs.map(async (subdir: string) => {
      const res = path.resolve(dir, subdir);
      return (await stat(res)).isDirectory() ? getFiles(res) : res;
    })
  );
  // @ts-ignore
  return files.reduce((a, f) => a.concat(f), [] as string[]);
}

export default async function collectFiles(paths: FilePaths) {
  const filesArr = await Promise.all(
    paths.include.map(includeDir =>
      getFiles(path.join(paths.rootDir, includeDir))
    )
  );
  const files = filesArr.reduce((a, f) => a.concat(f), [] as string[]);

  const filesWithExtensions = files.filter(f => {
    return paths.extensions.some(e => f.endsWith(e));
  });

  return filesWithExtensions.filter(f => {
    return !micromatch.isMatch(f, paths.exclude);
  });
}

import type { EventEmitter } from "node:events";

import type { Options as SWCOptions } from "@swc/core";

import { transformFile } from "@swc/core";

type CypressFile = {
  filePath: string;
  outputPath: string;
  shouldWatch: boolean;
} & EventEmitter;

type Preprocessor = (file: CypressFile) => Promise<string>;

type Cache = Map<string, string>;

export function swcPreprocessor(): Preprocessor {
  const cache: Cache = new Map();

  return getPreprocessor(cache);
}

function getPreprocessor(cache: Cache): Preprocessor {
  return async function preprocess(file) {
    if (!file.shouldWatch) {
      await build(file.filePath, { outputPath: file.outputPath });
      return file.outputPath;
    }

    await build(file.filePath, { outputPath: file.outputPath });
    return file.outputPath;
  };
}

async function build(
  filePath: string,
  swcOptions: SWCOptions & { outputPath: string },
): Promise<void> {
  await transformFile(filePath, swcOptions);
}

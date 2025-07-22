import type { EventEmitter } from "node:events";

import type { Options as SWCOptions } from "@swc/core";
import type { FSWatcher } from "chokidar";

import { writeFile } from "node:fs/promises";

import { transformFile } from "@swc/core";
import { watch } from "chokidar";

type CypressFile = {
  filePath: string;
  outputPath: string;
  shouldWatch: boolean;
} & EventEmitter;

type Preprocessor = (file: CypressFile) => Promise<string>;

type Cache = Map<string, string>;
type Watchers = Map<string, FSWatcher>;

export function swcPreprocessor(): Preprocessor {
  const cache: Cache = new Map();
  const watchers = new Map();

  return getPreprocessor(cache, watchers);
}

function getPreprocessor(cache: Cache, watchers: Watchers): Preprocessor {
  return async function preprocess(file) {
    const cachedOutputPath = cache.get(file.filePath);
    if (cachedOutputPath) return cachedOutputPath;

    await build(file.filePath, { outputPath: file.outputPath });
    cache.set(file.filePath, file.outputPath);

    if (!file.shouldWatch) {
      return file.outputPath;
    }

    if (watchers.has(file.filePath)) {
      return file.outputPath;
    }

    const watcher = watch(file.filePath, { ignoreInitial: true });

    watcher.on("change", async () => {
      await build(file.filePath, { outputPath: file.outputPath });
      file.emit("rerun");
    });

    watchers.set(file.filePath, watcher);

    file.on("close", () => {
      const watcher = watchers.get(file.filePath);
      if (watcher) {
        watcher.close();
        watchers.delete(file.filePath);
      }
      cache.delete(file.filePath);
    });

    return file.outputPath;
  };
}

async function build(
  filePath: string,
  swcOptions: SWCOptions & { outputPath: string },
): Promise<void> {
  await transformFile(filePath, swcOptions).then((output) =>
    writeFile(swcOptions.outputPath, output.code),
  );
}

import { defineConfig } from "cypress";

import { swcPreprocessor } from "./src";

export default defineConfig({
  e2e: {
    watchForFileChanges: true,
    supportFile: false,
    setupNodeEvents(on) {
      on("file:preprocessor", swcPreprocessor());
    },
  },
});

#!/usr/bin/env node
// Copies the Ghostscript WebAssembly runtime (used for client-side PDF
// compression) into `public/gs/` so it can be served as a static asset and
// loaded lazily by the upload worker. The binary is ~15MB, so it is copied
// from node_modules at install/build time rather than committed to git.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const dest = join(root, "public", "gs");

const require = createRequire(import.meta.url);
let jsPath;
try {
  jsPath = require.resolve("@okathira/ghostpdl-wasm/gs.js");
} catch {
  console.error("copy-gs: @okathira/ghostpdl-wasm is not installed; skipping (PDF compression will be disabled).");
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
const srcDir = dirname(jsPath);
for (const name of ["gs.js", "gs.wasm"]) {
  const from = join(srcDir, name);
  if (!existsSync(from)) {
    console.error(`copy-gs: missing ${from}`);
    process.exit(1);
  }
  copyFileSync(from, join(dest, name));
}
console.log(`copy-gs: ghostscript wasm -> public/gs/`);

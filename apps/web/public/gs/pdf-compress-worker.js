// Module Web Worker that runs Ghostscript (compiled to WebAssembly) to
// re-encode a PDF off the main thread. Ghostscript resamples embedded images,
// subsets fonts and repacks streams, which shrinks scans by 60–85% and
// text-heavy documents by ~40% without rasterising (text stays selectable).
//
// The wasm runtime (gs.js + gs.wasm) is copied into /gs/ at build time by
// apps/web/scripts/copy-gs.mjs. Ghostscript is AGPL-3.0: https://www.ghostscript.com
import loadWASM from "/gs/gs.js";

let modulePromise = null;
function getModule() {
  if (!modulePromise) modulePromise = loadWASM();
  return modulePromise;
}

self.onmessage = async (event) => {
  const data = event.data || {};
  const id = data.id;
  const preset = data.preset || "ebook";
  try {
    const Module = await getModule();
    const input = `in-${id}.pdf`;
    const output = `out-${id}.pdf`;
    Module.FS.writeFile(input, new Uint8Array(data.buffer));
    try {
      Module.callMain([
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.7",
        `-dPDFSETTINGS=/${preset}`,
        "-dDetectDuplicateImages=true",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        "-dSAFER",
        `-sOutputFile=${output}`,
        input,
      ]);
    } catch (err) {
      // Emscripten throws the process exit code even on a successful run.
      if (!Module.FS.analyzePath(output).exists) throw err;
    }
    const out = Module.FS.readFile(output);
    Module.FS.unlink(input);
    Module.FS.unlink(output);
    self.postMessage({ id, ok: true, buffer: out.buffer }, [out.buffer]);
  } catch (err) {
    self.postMessage({ id, ok: false, error: String((err && err.message) || err) });
  }
};

/**
 * Client-side PDF compression.
 *
 * Runs Ghostscript (WASM) inside `/gs/pdf-compress-worker.js` so uploaded PDFs
 * take less R2 storage and upload faster. Everything happens in the browser —
 * the file is never sent to a third party for processing.
 *
 * Safe by design: if the worker, wasm runtime or compression is unavailable we
 * simply return the original file, and we never return a larger file than the
 * one we were given.
 */

export type PdfPreset = "screen" | "ebook" | "printer";

export interface PdfCompressStats {
  originalBytes: number;
  compressedBytes: number;
  savedBytes: number;
  /** compressedBytes / originalBytes, 0–1. */
  ratio: number;
}

export interface PdfCompressResult {
  file: File;
  stats: PdfCompressStats | null;
}

/** Files smaller than this are already cheap to store — don't bother. */
const DEFAULT_MIN_BYTES = 1_000_000;
/** Don't rewrite a PDF unless it saves at least this fraction. */
const MIN_SAVING = 0.03;
const WORKER_TIMEOUT_MS = 180_000;

let seq = 0;

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export async function compressPdf(
  file: File,
  opts: { preset?: PdfPreset; minBytes?: number } = {},
): Promise<PdfCompressResult> {
  const minBytes = opts.minBytes ?? DEFAULT_MIN_BYTES;
  if (!isPdfFile(file) || file.size < minBytes) return { file, stats: null };
  if (typeof Worker === "undefined" || typeof WebAssembly === "undefined") return { file, stats: null };

  const buffer = await file.arrayBuffer();
  let out: ArrayBuffer | null = null;
  try {
    out = await runInWorker(buffer, opts.preset ?? "ebook");
  } catch {
    return { file, stats: null };
  }

  if (!out || out.byteLength === 0 || out.byteLength >= file.size * (1 - MIN_SAVING)) {
    return { file, stats: null };
  }

  const compressed = new File([out], file.name, { type: "application/pdf", lastModified: Date.now() });
  return {
    file: compressed,
    stats: {
      originalBytes: file.size,
      compressedBytes: compressed.size,
      savedBytes: file.size - compressed.size,
      ratio: compressed.size / file.size,
    },
  };
}

function runInWorker(buffer: ArrayBuffer, preset: PdfPreset): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker("/gs/pdf-compress-worker.js", { type: "module" });
    } catch (err) {
      reject(err);
      return;
    }

    const id = ++seq;
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      fn();
    };
    const timer = setTimeout(() => finish(() => reject(new Error("Compression timed out."))), WORKER_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data || {};
      if (data.id !== id) return;
      if (data.ok && data.buffer) finish(() => resolve(data.buffer as ArrayBuffer));
      else finish(() => reject(new Error(data.error || "Compression failed.")));
    };
    worker.onerror = (event: ErrorEvent) => finish(() => reject(new Error(event.message || "Compression worker error.")));

    worker.postMessage({ id, buffer, preset }, [buffer]);
  });
}

interface WasmExport {
  name: string;
  kind: string;
}

interface WasmImport {
  module: string;
  name: string;
  kind: string;
}

interface WasmParse {
  valid: boolean;
  error?: string;
  /** "wasi" when the module imports a WASI preview, otherwise "core" */
  runtime: string | null;
  exports: WasmExport[];
  imports: WasmImport[];
}

const WASI_MODULES = new Set([
  "wasi_snapshot_preview1",
  "wasi_unstable",
  "wasi",
]);

/**
 * Parse a WebAssembly binary, extracting its exports, imports, and inferred
 * runtime. Uses the engine's own validating compiler, so a non-WASM or
 * malformed binary is rejected (`valid: false`).
 */
export const parseWasm = (bytes: Uint8Array): WasmParse => {
  try {
    const ab = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const mod = new WebAssembly.Module(ab);
    const exports = WebAssembly.Module.exports(mod).map((e) => ({
      name: e.name,
      kind: e.kind,
    }));
    const imports = WebAssembly.Module.imports(mod).map((i) => ({
      module: i.module,
      name: i.name,
      kind: i.kind,
    }));
    const runtime = imports.some((i) => WASI_MODULES.has(i.module))
      ? "wasi"
      : "core";
    return { valid: true, runtime, exports, imports };
  } catch (e) {
    return {
      valid: false,
      error: (e as Error).message,
      runtime: null,
      exports: [],
      imports: [],
    };
  }
};

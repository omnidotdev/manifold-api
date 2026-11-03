/**
 * Build a JSON error body for the WASM registry.
 */
export const wasmError = (message: string) => ({ errors: [{ message }] });

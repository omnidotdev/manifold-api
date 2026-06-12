interface NpmError {
  error: string;
}

/** npm clients expect `{ "error": "<reason>" }`. */
export const npmError = (reason: string): NpmError => ({ error: reason });

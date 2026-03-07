interface CargoError {
  errors: { detail: string }[];
}

/**
 * Format an error response in Cargo's expected shape.
 */
export const cargoError = (detail: string): CargoError => ({
  errors: [{ detail }],
});

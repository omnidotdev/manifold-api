/**
 * Build a JSON error body for the schema registry.
 */
export const schemaError = (message: string) => ({ errors: [{ message }] });

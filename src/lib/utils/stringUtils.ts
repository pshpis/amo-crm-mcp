/**
 * Type guard to check if value is a primitive (not object or null)
 */
export function isPrimitive(value: unknown): value is string | number | boolean | symbol | bigint {
  return value !== null && value !== undefined && typeof value !== 'object';
}

/**
 * Safely converts a value to string, handling objects and primitives correctly.
 * Objects are stringified with JSON.stringify, primitives are converted safely.
 *
 * @param value - The value to convert to string
 * @returns Empty string for null/undefined, JSON string for objects, string representation for primitives
 */
export function safeToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (isPrimitive(value)) {
    return String(value);
  }
  // At this point value must be an object
  return JSON.stringify(value);
}

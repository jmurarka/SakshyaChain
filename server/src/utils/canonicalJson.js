/**
 * canonicalize — deterministic JSON serialization.
 *
 * Sorts object keys recursively before stringifying so the
 * same logical manifest always produces the exact same byte string and SHA-256 digest,
 * no matter how it was constructed or fetched from database.
 */
export function sortKeysDeep(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === 'object') {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortKeysDeep(value[key]);
    }
    return sorted;
  }
  return value;
}

export function canonicalize(value) {
  return JSON.stringify(sortKeysDeep(value));
}

export default { canonicalize, sortKeysDeep };

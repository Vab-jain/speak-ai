/**
 * Storage Adapter
 * Unified persistence layer for all local storage needs.
 */

/**
 * Read data from local storage.
 * @param {string} key
 * @param {any} defaultValue
 * @returns {any}
 */
export function readStorage(key, defaultValue) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (err) {
    console.error(`Failed to parse ${key} from localStorage`, err);
    return defaultValue;
  }
}

/**
 * Write data to local storage.
 * @param {string} key
 * @param {any} data
 */
export function writeStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save ${key} to localStorage`, err);
  }
}

/**
 * Export all relevant keys to a single JSON blob.
 * @param {string[]} keys
 * @returns {Blob}
 */
export function exportStorage(keys) {
  const data = {};
  for (const key of keys) {
    data[key] = readStorage(key, {});
  }
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
}

/**
 * Import data from a JSON blob/file.
 * @param {File|Blob} file
 * @param {Function} onComplete - Callback with parsed data
 * @param {Function} onError
 */
export function importStorage(file, onComplete, onError) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      onComplete(data);
    } catch (err) {
      if (onError) onError(err);
    }
  };
  reader.readAsText(file);
}

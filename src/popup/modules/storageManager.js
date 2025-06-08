/**
 * Asynchronously retrieves data from the browser's local storage.
 * This function wraps the native `chrome.storage.local.get` API in a Promise.
 *
 * @param {string|string[]|object|null} keys - A key (string) or keys (array of strings) to identify the data to retrieve
 * @returns {Promise<object>} A Promise that resolves with an object containing the retrieved data
 */
export async function getStorage(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (data) => {
      resolve(data);
    });
  });
}

/**
 * Asynchronously stores data in the browser's local storage.
 * This function wraps the native `chrome.storage.local.set` API in a Promise.
 *
 * @param {object} items - An object containing key-value pairs to store
 * @returns {Promise<void>} A Promise that resolves once the data has been successfully stored
 */
export async function setStorage(items) {
  return new Promise((resolve) => {
    chrome.storage.local.set(items, () => {
      resolve();
    });
  });
}

export async function getStorage(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (data) => {
      resolve(data);
    });
  });
}

export async function setStorage(items) {
  return new Promise((resolve) => {
    chrome.storage.local.set(items, () => {
      resolve();
    });
  });
}

export function getSync(keys) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, resolve);
  });
}

export function setSync(data) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(data, resolve);
  });
}

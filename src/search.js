import { getSync, setSync } from './storage.js';

const searchEngines = {
  google: {
    name: 'Google',
    icon: 'https://www.google.com/favicon.ico',
    url: 'https://www.google.com/search?q='
  },
  bing: {
    name: 'Bing',
    icon: 'https://www.bing.com/favicon.ico',
    url: 'https://www.bing.com/search?q='
  },
  baidu: {
    name: 'Baidu',
    icon: 'https://www.baidu.com/favicon.ico',
    url: 'https://www.baidu.com/s?wd='
  },
  yandex: {
    name: 'Yandex',
    icon: 'https://yandex.com/favicon.ico',
    url: 'https://yandex.com/search/?text='
  }
};

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchEngineSelect = document.getElementById('searchEngineSelect');
const searchEngineIndicator = document.getElementById('searchEngineIndicator');
const searchEngineIcon = document.getElementById('searchEngineIcon');
const searchEngineDropdown = document.getElementById('searchEngineDropdown');

let currentSearchEngine = 'google';

function updateSearchEngineDisplay() {
  const engine = searchEngines[currentSearchEngine];
  searchEngineIcon.src = engine.icon;
}

function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    return;
  }

  let url;
  let isUrl = false;

  try {
    url = new URL(query);
    isUrl = true;
  } catch {
    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (domainPattern.test(query)) {
      try {
        url = new URL(`https://${query}`);
        isUrl = true;
      } catch {
        isUrl = false;
      }
    }
  }

  if (isUrl && url) {
    window.location.href = url.href;
    return;
  }

  const engine = searchEngines[currentSearchEngine];
  const searchUrl = engine.url + encodeURIComponent(query);
  window.location.href = searchUrl;
}

async function changeSearchEngine() {
  currentSearchEngine = searchEngineSelect.value;
  await setSync({ searchEngine: currentSearchEngine });
  updateSearchEngineDisplay();
}

function showSearchEngineDropdown() {
  searchEngineDropdown.innerHTML = '';

  Object.entries(searchEngines).forEach(([key, engine]) => {
    const btn = document.createElement('button');
    btn.className = `engine-option${currentSearchEngine === key ? ' selected' : ''}`;
    const check = currentSearchEngine === key ? '✓' : '';
    btn.innerHTML = `<span class="engine-check">${check}</span><img src="${engine.icon}" style="width:20px;height:20px;vertical-align:middle;border-radius:4px;margin-right:8px;">${engine.name}`;
    btn.onclick = async () => {
      currentSearchEngine = key;
      await setSync({ searchEngine: currentSearchEngine });
      updateSearchEngineDisplay();
      if (searchEngineSelect) {
        searchEngineSelect.value = key;
        const event = new Event('change', { bubbles: true });
        searchEngineSelect.dispatchEvent(event);
      }
      searchEngineDropdown.style.display = 'none';
    };
    searchEngineDropdown.appendChild(btn);
  });

  searchEngineDropdown.style.display = 'flex';
  setTimeout(() => {
    document.addEventListener('mousedown', hideSearchEngineDropdown, { once: true });
  }, 0);
}

function hideSearchEngineDropdown(event) {
  if (
    !searchEngineDropdown.contains(event.target) &&
    event.target.id !== 'searchEngineIndicator' &&
    event.target.id !== 'searchEngineIcon'
  ) {
    searchEngineDropdown.style.display = 'none';
  }
}

function focusSearchIfNeeded(event) {
  if (
    !event.target.closest('.search-container') &&
    !event.target.closest('#settingsBtn') &&
    !event.target.closest('#themeToggleWrapper') &&
    !event.target.closest('#settingsModal')
  ) {
    searchInput.focus();
  }
}

export async function initSearch() {
  const { searchEngine } = await getSync(['searchEngine']);
  currentSearchEngine = searchEngine || 'google';
  searchEngineSelect.value = currentSearchEngine;
  updateSearchEngineDisplay();

  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  });
  searchEngineSelect.addEventListener('change', changeSearchEngine);
  searchEngineIndicator.addEventListener('click', showSearchEngineDropdown);

  searchInput.focus();
  document.addEventListener('click', focusSearchIfNeeded);
}

import { loadAndRenderDials } from './dials.js';
import { initSearch } from './search.js';
import { initSettings } from './settings.js';
import { initTheme } from './theme.js';

async function initApp() {
  initTheme();
  await initSearch();
  await initSettings({ onDialsChanged: loadAndRenderDials });
  await loadAndRenderDials();
}

initApp();

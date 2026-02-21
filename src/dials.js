import { getSync, setSync } from './storage.js';
import { getFavicon, isValidUrl } from './utils.js';

const container = document.getElementById('dial-container');

function normalizeDial(dial) {
  const url = typeof dial === 'string' ? dial : dial.url;
  if (!url || !isValidUrl(url)) {
    return null;
  }

  const name =
    typeof dial === 'string'
      ? new URL(dial).hostname
      : dial.name || new URL(dial.url).hostname;

  const customIcon = typeof dial === 'string' ? null : dial.customIcon;

  return { url, name, customIcon };
}

function createRemoveButton(card, index) {
  const btn = document.createElement('button');
  btn.className = 'remove-btn';
  btn.innerHTML = '×';
  btn.title = 'Delete';
  btn.style.position = 'absolute';
  btn.style.top = '8px';
  btn.style.right = '8px';
  btn.style.width = '24px';
  btn.style.height = '24px';
  btn.style.background = 'rgba(255, 64, 64, 0.95)';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.borderRadius = '50%';
  btn.style.fontSize = '18px';
  btn.style.cursor = 'pointer';
  btn.style.zIndex = 20;
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    removeDial(index);
  });

  card.appendChild(btn);

  const hideButton = () => {
    btn.remove();
    document.removeEventListener('click', hideButton, true);
    window.removeEventListener('scroll', hideButton, true);
  };

  setTimeout(() => {
    document.addEventListener('click', hideButton, true);
    window.addEventListener('scroll', hideButton, true);
  }, 0);
}

function createDialCard(dial, index, showDomain) {
  const card = document.createElement('div');
  card.className = 'dial-card';
  card.setAttribute('draggable', 'false');
  card.innerHTML = `
    <a href="${dial.url}" class="dial-link${showDomain ? '' : ' no-name'}">
      <img src="${getFavicon(dial.url, dial.customIcon)}" alt="icon" />
      <span class="dial-name${showDomain ? '' : ' hidden'}">${dial.name}</span>
    </a>`;

  let dragTimer = null;
  let dragReady = false;

  const link = card.querySelector('a');
  const name = card.querySelector('.dial-name');
  link.addEventListener('dragstart', (event) => {
    if (!dragReady) {
      event.preventDefault();
    }
  });
  if (name) {
    name.addEventListener('dragstart', (event) => event.preventDefault());
  }

  card.addEventListener('click', (event) => {
    if (event.target.tagName.toLowerCase() === 'a' || event.target.closest('a')) {
      return;
    }
    window.location.href = dial.url;
  });

  card.addEventListener('pointerdown', () => {
    dragTimer = setTimeout(() => {
      dragReady = true;
      card.setAttribute('draggable', 'true');
      card.classList.add('drag-ready');
    }, 200);
  });

  const cancelDragReady = () => {
    if (dragTimer) {
      clearTimeout(dragTimer);
      dragTimer = null;
    }
    if (!card.classList.contains('dragging')) {
      dragReady = false;
      card.setAttribute('draggable', 'false');
      card.classList.remove('drag-ready');
    }
  };

  card.addEventListener('pointerup', cancelDragReady);
  card.addEventListener('pointerleave', cancelDragReady);
  card.addEventListener('pointercancel', cancelDragReady);

  card.addEventListener('dragstart', (event) => {
    if (!dragReady) {
      event.preventDefault();
      return;
    }
    card.classList.add('dragging');
    card.classList.remove('drag-ready');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
    event.dataTransfer.setDragImage(card, card.offsetWidth / 2, card.offsetHeight / 2);
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    card.classList.remove('drag-over');
    card.classList.remove('drag-ready');
    dragReady = false;
    card.setAttribute('draggable', 'false');
  });

  card.addEventListener('dragover', (event) => {
    event.preventDefault();
    card.classList.add('drag-over');
  });

  card.addEventListener('dragleave', () => {
    card.classList.remove('drag-over');
  });

  card.addEventListener('drop', async (event) => {
    event.preventDefault();
    card.classList.remove('drag-over');
    card.classList.remove('drag-ready');
    const fromIndex = Number.parseInt(event.dataTransfer.getData('text/plain'), 10);
    if (Number.isNaN(fromIndex) || fromIndex === index) {
      return;
    }
    await moveDial(fromIndex, index);
  });

  card.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    document.querySelectorAll('.remove-btn').forEach((btn) => btn.remove());
    createRemoveButton(card, index);
  });

  return card;
}

function cleanInvalidDials(dials) {
  return dials.filter((dial) => {
    const url = typeof dial === 'string' ? dial : dial.url;
    return url && isValidUrl(url);
  });
}

export async function renderDials(dials) {
  const { showDomain } = await getSync(['showDomain']);
  const shouldShowDomain = showDomain !== false;

  container.innerHTML = '';

  dials.forEach((dial, index) => {
    const normalized = normalizeDial(dial);
    if (!normalized) {
      return;
    }
    const card = createDialCard(normalized, index, shouldShowDomain);
    container.appendChild(card);
  });
}

export async function loadAndRenderDials() {
  const { dials = [], defaultsSeeded } = await getSync(['dials', 'defaultsSeeded']);
  if (dials.length === 0 && !defaultsSeeded) {
    const defaults = [
      { url: 'https://www.google.com', name: 'Google' },
      { url: 'https://www.youtube.com', name: 'YouTube' },
      { url: 'https://www.github.com', name: 'GitHub' },
      { url: 'https://www.reddit.com', name: 'Reddit' },
      { url: 'https://www.x.com', name: 'X' }
    ];
    await setSync({ dials: defaults, defaultsSeeded: true });
    await renderDials(defaults);
    return;
  }
  const cleaned = cleanInvalidDials(dials);

  if (cleaned.length !== dials.length) {
    await setSync({ dials: cleaned });
  }

  await renderDials(cleaned);
}

export async function removeDial(index) {
  const { dials = [] } = await getSync(['dials']);
  dials.splice(index, 1);
  await setSync({ dials });
  await renderDials(dials);
}

async function moveDial(fromIndex, toIndex) {
  const { dials = [] } = await getSync(['dials']);
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= dials.length ||
    toIndex >= dials.length
  ) {
    return;
  }
  const [moved] = dials.splice(fromIndex, 1);
  dials.splice(toIndex, 0, moved);
  await setSync({ dials });
  await renderDials(dials);
}

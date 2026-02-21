import { getSync, setSync } from './storage.js';
import { formatUrl, getWebsiteTitle } from './utils.js';

const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const modalUrlInput = document.getElementById('modalUrlInput');
const modalNameInput = document.getElementById('modalNameInput');
const modalAddBtn = document.getElementById('modalAddBtn');
const closeModal = document.getElementById('closeModal');
const showDomainToggle = document.getElementById('showDomainToggle');
const iconUpload = document.getElementById('iconUpload');
const iconPreview = document.getElementById('iconPreview');
const previewImage = document.getElementById('previewImage');
const removeIcon = document.getElementById('removeIcon');
const iconUrlInput = document.getElementById('iconUrlInput');
const loadIconUrl = document.getElementById('loadIconUrl');

const iconTabs = document.querySelectorAll('.icon-tab');
const uploadTab = document.getElementById('uploadTab');
const urlTab = document.getElementById('urlTab');

let selectedIconData = null;

function switchIconTab(tabName) {
  iconTabs.forEach((tab) => tab.classList.remove('active'));
  uploadTab.style.display = 'none';
  urlTab.style.display = 'none';

  const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  if (tabName === 'upload') {
    uploadTab.style.display = 'block';
  } else if (tabName === 'url') {
    urlTab.style.display = 'block';
  }
}

function showSettingsModal() {
  settingsModal.style.display = 'flex';
  settingsModal.style.pointerEvents = 'auto';
  settingsModal.hidden = false;
  settingsModal.setAttribute('aria-hidden', 'false');
  modalUrlInput.focus();
  selectedIconData = null;
  iconPreview.style.display = 'none';
}

function hideSettingsModal() {
  settingsModal.style.display = 'none';
  settingsModal.style.pointerEvents = 'none';
  settingsModal.hidden = true;
  settingsModal.setAttribute('aria-hidden', 'true');
  modalUrlInput.value = '';
  modalNameInput.value = '';
  iconUrlInput.value = '';
  selectedIconData = null;
  iconPreview.style.display = 'none';
  iconUpload.value = '';
  switchIconTab('upload');
}

function handleIconUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件！');
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    alert('图片文件大小不能超过2MB！');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    selectedIconData = e.target.result;
    previewImage.src = selectedIconData;
    iconPreview.style.display = 'flex';
  };
  reader.readAsDataURL(file);
}

function removeSelectedIcon() {
  selectedIconData = null;
  iconPreview.style.display = 'none';
  iconUpload.value = '';
}

function handleIconUrlLoad() {
  const url = iconUrlInput.value.trim();
  if (!url) {
    alert('请输入图标URL！');
    iconUrlInput.focus();
    return;
  }

  try {
    new URL(url);
  } catch {
    alert('请输入有效的URL！');
    iconUrlInput.focus();
    return;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = function () {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;

    try {
      ctx.drawImage(img, 0, 0);
      selectedIconData = canvas.toDataURL('image/png');
      previewImage.src = selectedIconData;
      iconPreview.style.display = 'flex';
    } catch {
      alert('无法加载该图片，可能是跨域限制。请尝试其他图片URL。');
    }
  };

  img.onerror = function () {
    alert('无法加载图片，请检查URL是否正确！');
  };

  img.src = url;
}

async function addWebsiteFromModal(onDialsChanged) {
  const url = modalUrlInput.value.trim();
  const name = modalNameInput.value.trim();

  if (!url) {
    alert('请输入网址！');
    modalUrlInput.focus();
    return;
  }

  const formatted = formatUrl(url);
  if (!formatted) {
    alert('请输入有效网址！');
    modalUrlInput.focus();
    return;
  }

  const websiteName = name || (await getWebsiteTitle(formatted));
  const { dials = [] } = await getSync(['dials']);

  dials.push({
    url: formatted,
    name: websiteName,
    customIcon: selectedIconData
  });

  await setSync({ dials });
  await onDialsChanged();

  modalUrlInput.value = '';
  modalNameInput.value = '';
  selectedIconData = null;
  iconPreview.style.display = 'none';
  iconUpload.value = '';
  modalUrlInput.focus();
}

async function toggleDomainDisplay(onDialsChanged) {
  const showDomain = showDomainToggle.checked;
  await setSync({ showDomain });
  await onDialsChanged();
}

export async function initSettings({ onDialsChanged }) {
  const { showDomain } = await getSync(['showDomain']);
  showDomainToggle.checked = showDomain !== false;

  settingsBtn.addEventListener('click', showSettingsModal);
  const closeModalHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    hideSettingsModal();
  };
  closeModal.addEventListener('pointerdown', closeModalHandler, { passive: false });
  closeModal.addEventListener('click', closeModalHandler);
  closeModal.addEventListener('touchstart', closeModalHandler, { passive: false });
  modalAddBtn.addEventListener('click', () => addWebsiteFromModal(onDialsChanged));
  showDomainToggle.addEventListener('change', () => toggleDomainDisplay(onDialsChanged));
  iconUpload.addEventListener('change', handleIconUpload);
  removeIcon.addEventListener('click', removeSelectedIcon);
  loadIconUrl.addEventListener('click', handleIconUrlLoad);

  iconTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchIconTab(tabName);
    });
  });

  iconUrlInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      handleIconUrlLoad();
    }
  });

  modalUrlInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      addWebsiteFromModal(onDialsChanged);
    }
  });

  settingsModal.addEventListener('click', (event) => {
    if (event.target === settingsModal) {
      hideSettingsModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && settingsModal.style.display === 'flex') {
      hideSettingsModal();
    }
  });
}

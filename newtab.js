const container = document.getElementById('dial-container');

function getFavicon(url, customIcon = null) {
  // 如果有自定义图标，优先使用
  if (customIcon) {
    return customIcon;
  }
  
  let domain;
  try {
    domain = new URL(url).hostname;
  } catch {
    return 'icons/icon128.png';
  }
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function renderDials(dials) {
  console.log('开始渲染dials:', dials);
  container.innerHTML = '';
  
  // 先获取设置，然后渲染
  chrome.storage.sync.get(['showDomain'], (res) => {
    const showDomain = res.showDomain !== false; // 默认显示
    console.log('显示设置:', showDomain);
    
    dials.forEach((dial, i) => {
      try {
        const url = typeof dial === 'string' ? dial : dial.url;
        const name = typeof dial === 'string' ? new URL(dial).hostname : (dial.name || new URL(dial.url).hostname);
        const customIcon = typeof dial === 'string' ? null : dial.customIcon;
        
        // 验证URL是否有效
        let domain;
        try {
          domain = new URL(url).hostname;
        } catch (e) {
          console.warn("无效网址跳过：", url, e.message);
          return; // 跳过这个无效的dial
        }
        
        console.log('处理dial:', dial, 'URL:', url, 'Name:', name);
        
        const card = document.createElement('div');
        card.className = 'dial-card';
        
        // 始终渲染 span, 用 CSS 控制可见性
        card.innerHTML = `
          <a href="${url}" class="dial-link${showDomain ? '' : ' no-name'}">
            <img src="${getFavicon(url, customIcon)}" alt="icon" />
            <span class="dial-name${showDomain ? '' : ' hidden'}">${name}</span>
          </a>`;
        
        card.addEventListener('click', (e) => {
          if (e.target.tagName.toLowerCase() === 'a' || e.target.closest('a')) return;
          window.location.href = url;
        });
        // 右键显示删除图标
        card.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          // 移除已有的删除按钮
          document.querySelectorAll('.remove-btn').forEach(btn => btn.remove());
          // 创建删除按钮
          const btn = document.createElement('button');
          btn.className = 'remove-btn';
          btn.innerHTML = '×';
          btn.title = '删除';
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
          btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            removeDial(i);
          });
          card.appendChild(btn);
          // 点击其他地方或滚动时隐藏按钮
          const hideBtn = () => { btn.remove(); document.removeEventListener('click', hideBtn, true); window.removeEventListener('scroll', hideBtn, true); };
          setTimeout(() => {
            document.addEventListener('click', hideBtn, true);
            window.addEventListener('scroll', hideBtn, true);
          }, 0);
        });
        container.appendChild(card);
      } catch (error) {
        console.error('处理dial时出错:', dial, error);
        // 继续处理下一个dial，不中断整个渲染过程
      }
    });
    console.log('渲染完成，添加了', container.children.length, '个卡片');
  });
}

function formatURL(input) {
  try {
    // 尝试用 URL 构造（用户已输入 http/https）
    return new URL(input).href;
  } catch {
    // 尝试补上 https:// 再解析
    try {
      return new URL("https://" + input).href;
    } catch {
      return null;
    }
  }
}

function addDial() {
  // 这个函数现在不再使用，因为添加功能已经移到模态框中
  // 保留函数以避免错误，但实际功能在 addWebsiteFromModal 中
  console.log('addDial 函数已弃用，请使用设置模态框添加网站');
}

function removeDial(index) {
  chrome.storage.sync.get(['dials'], (res) => {
    const dials = res.dials || [];
    dials.splice(index, 1);
    chrome.storage.sync.set({ dials }, () => renderDials(dials));
  });
}

// 清理无效的URL
function cleanInvalidUrls(dials) {
  const validDials = [];
  dials.forEach(dial => {
    try {
      const url = typeof dial === 'string' ? dial : dial.url;
      new URL(url); // 验证URL是否有效
      validDials.push(dial);
    } catch (e) {
      console.warn('移除无效URL:', dial);
    }
  });
  return validDials;
}

chrome.storage.sync.get(['dials'], (res) => {
  const dials = res.dials || [];
  console.log('初始化时获取到的dials:', dials);
  
  // 清理无效URL
  const cleanedDials = cleanInvalidUrls(dials);
  if (cleanedDials.length !== dials.length) {
    console.log('清理了', dials.length - cleanedDials.length, '个无效URL');
    // 保存清理后的数据
    chrome.storage.sync.set({ dials: cleanedDials }, () => {
      renderDials(cleanedDials);
    });
  } else {
    renderDials(dials);
  }
});

// 页面右下角添加设置按钮
const settingsBtn = document.createElement('button');
settingsBtn.id = 'settingsBtn';
settingsBtn.innerHTML = '⚙️';
settingsBtn.title = '设置';
settingsBtn.style.position = 'fixed';
settingsBtn.style.right = '32px';
settingsBtn.style.bottom = '32px';
settingsBtn.style.zIndex = '1000';
document.body.appendChild(settingsBtn);

// 主题切换逻辑
const themeBtn = document.getElementById('themeToggleBtn');
function setTheme(mode) {
  document.body.classList.remove('light-mode', 'dark-mode');
  document.body.classList.add(mode);
  // 切换SVG图标
  const moon = document.getElementById('moonIcon');
  const sunGroup = document.getElementById('sunGroup');
  if (mode === 'light-mode') {
    if(moon) { moon.style.display = 'inline'; }
    if(sunGroup) { sunGroup.style.display = 'none'; }
  } else {
    if(moon) moon.style.display = 'none';
    if(sunGroup) sunGroup.style.display = 'inline';
  }
  localStorage.setItem('monoTabTheme', mode);
}
// 初始化主题
const savedTheme = localStorage.getItem('monoTabTheme');
setTheme(savedTheme === 'light-mode' ? 'light-mode' : 'dark-mode');
themeBtn.addEventListener('click', () => {
  const isLight = document.body.classList.contains('light-mode');
  setTheme(isLight ? 'dark-mode' : 'light-mode');
});

// 模态框相关逻辑
const settingsModal = document.getElementById('settingsModal');
const modalUrlInput = document.getElementById('modalUrlInput');
const modalAddBtn = document.getElementById('modalAddBtn');
const closeModal = document.getElementById('closeModal');
const showDomainToggle = document.getElementById('showDomainToggle');
const modalNameInput = document.getElementById('modalNameInput');
const iconUpload = document.getElementById('iconUpload');
const iconPreview = document.getElementById('iconPreview');
const previewImage = document.getElementById('previewImage');
const removeIcon = document.getElementById('removeIcon');
const iconUrlInput = document.getElementById('iconUrlInput');
const loadIconUrl = document.getElementById('loadIconUrl');

// 标签切换相关
const iconTabs = document.querySelectorAll('.icon-tab');
const uploadTab = document.getElementById('uploadTab');
const urlTab = document.getElementById('urlTab');

// 当前选择的图标数据
let selectedIconData = null;

// 标签切换功能
function switchIconTab(tabName) {
  // 移除所有活动状态
  iconTabs.forEach(tab => tab.classList.remove('active'));
  
  // 隐藏所有内容
  uploadTab.style.display = 'none';
  urlTab.style.display = 'none';
  
  // 激活选中的标签
  const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }
  
  // 显示对应内容
  if (tabName === 'upload') {
    uploadTab.style.display = 'block';
  } else if (tabName === 'url') {
    urlTab.style.display = 'block';
  }
}

// 处理图标URL加载
function handleIconUrlLoad() {
  const url = iconUrlInput.value.trim();
  if (!url) {
    alert('请输入图标URL！');
    iconUrlInput.focus();
    return;
  }
  
  // 验证URL格式
  try {
    new URL(url);
  } catch {
    alert('请输入有效的URL！');
    iconUrlInput.focus();
    return;
  }
  
  // 创建图片对象来验证图片是否可加载
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = function() {
    // 创建canvas来转换图片为base64
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    
    try {
      ctx.drawImage(img, 0, 0);
      selectedIconData = canvas.toDataURL('image/png');
      previewImage.src = selectedIconData;
      iconPreview.style.display = 'flex';
      console.log('图标URL加载成功');
    } catch (error) {
      console.error('转换图片失败:', error);
      alert('无法加载该图片，可能是跨域限制。请尝试其他图片URL。');
    }
  };
  
  img.onerror = function() {
    alert('无法加载图片，请检查URL是否正确！');
  };
  
  img.src = url;
}

// 显示模态框
function showSettingsModal() {
  console.log('显示设置模态框');
  settingsModal.style.display = 'flex';
  modalUrlInput.focus();
  // 重置图标选择
  selectedIconData = null;
  iconPreview.style.display = 'none';
}

// 隐藏模态框
function hideSettingsModal() {
  console.log('隐藏设置模态框');
  settingsModal.style.display = 'none';
  modalUrlInput.value = '';
  modalNameInput.value = '';
  iconUrlInput.value = '';
  // 重置图标选择
  selectedIconData = null;
  iconPreview.style.display = 'none';
  iconUpload.value = '';
  // 重置标签状态
  switchIconTab('upload');
}

// 处理图标上传
function handleIconUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件！');
    return;
  }
  
  // 验证文件大小（限制为2MB）
  if (file.size > 2 * 1024 * 1024) {
    alert('图片文件大小不能超过2MB！');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    selectedIconData = e.target.result;
    previewImage.src = selectedIconData;
    iconPreview.style.display = 'flex';
  };
  reader.readAsDataURL(file);
}

// 移除选择的图标
function removeSelectedIcon() {
  selectedIconData = null;
  iconPreview.style.display = 'none';
  iconUpload.value = '';
}

// 获取网站标题
async function getWebsiteTitle(url) {
  try {
    // 由于跨域限制，我们需要使用一个代理服务或者直接使用域名作为备选
    // 这里我们使用一个简单的方法：尝试从URL中提取有意义的信息
    const urlObj = new URL(url);
    let title = urlObj.hostname;
    
    // 移除常见的子域名前缀
    title = title.replace(/^www\./, '');
    
    // 对于某些知名网站，我们可以提供更好的默认名称
    const knownSites = {
      'google.com': 'Google',
      'youtube.com': 'YouTube',
      'github.com': 'GitHub',
      'stackoverflow.com': 'Stack Overflow',
      'reddit.com': 'Reddit',
      'twitter.com': 'Twitter',
      'facebook.com': 'Facebook',
      'instagram.com': 'Instagram',
      'linkedin.com': 'LinkedIn',
      'baidu.com': '百度',
      'bilibili.com': '哔哩哔哩',
      'zhihu.com': '知乎',
      'weibo.com': '微博',
      'taobao.com': '淘宝',
      'tmall.com': '天猫',
      'jd.com': '京东',
      'qq.com': '腾讯',
      '163.com': '网易',
      'sina.com.cn': '新浪',
      'sohu.com': '搜狐'
    };
    
    // 检查是否是已知网站
    for (const [domain, siteName] of Object.entries(knownSites)) {
      if (title.includes(domain)) {
        return siteName;
      }
    }
    
    // 如果不是已知网站，尝试从域名中提取更有意义的名称
    const domainParts = title.split('.');
    if (domainParts.length >= 2) {
      const mainDomain = domainParts[domainParts.length - 2];
      // 将域名转换为更友好的格式（首字母大写）
      return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
    }
    
    return title;
  } catch (error) {
    console.error('获取网站标题失败:', error);
    return '新网站';
  }
}

// 模态框添加网站
async function addWebsiteFromModal() {
  console.log('尝试添加网站');
  const url = modalUrlInput.value.trim();
  const name = modalNameInput.value.trim();
  console.log('URL:', url, 'Name:', name);
  if (!url) {
    alert('请输入网址！');
    modalUrlInput.focus();
    return;
  }
  
  const formatted = formatURL(url);
  console.log('格式化后的URL:', formatted);
  if (!formatted) {
    alert('请输入有效网址！');
    modalUrlInput.focus();
    return;
  }
  
  // 如果没有输入名称，尝试获取网站标题
  let websiteName = name;
  if (!websiteName) {
    websiteName = await getWebsiteTitle(formatted);
  }
  
  chrome.storage.sync.get(['dials'], (res) => {
    const dials = res.dials || [];
    console.log('当前dials:', dials);
    const newDial = {
      url: formatted,
      name: websiteName,
      customIcon: selectedIconData // 添加自定义图标
    };
    dials.push(newDial);
    console.log('添加后的dials:', dials);
    chrome.storage.sync.set({ dials }, () => {
      renderDials(dials);
      // 清空输入框
      modalUrlInput.value = '';
      modalNameInput.value = '';
      // 重置图标选择
      selectedIconData = null;
      iconPreview.style.display = 'none';
      iconUpload.value = '';
      // 重新聚焦到URL输入框，方便连续添加
      modalUrlInput.focus();
      // 显示成功提示
      console.log('网站添加成功！');
    });
  });
}

// 切换域名显示
function toggleDomainDisplay() {
  const showDomain = showDomainToggle.checked;
  chrome.storage.sync.set({ showDomain }, () => {
    // 重新渲染以应用设置
    chrome.storage.sync.get(['dials'], (res) => {
      const dials = res.dials || [];
      renderDials(dials);
    });
  });
}

// 事件监听
settingsBtn.addEventListener('click', showSettingsModal);
closeModal.addEventListener('click', hideSettingsModal);
modalAddBtn.addEventListener('click', addWebsiteFromModal);
showDomainToggle.addEventListener('change', toggleDomainDisplay);
iconUpload.addEventListener('change', handleIconUpload);
removeIcon.addEventListener('click', removeSelectedIcon);

// 标签切换事件
iconTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.getAttribute('data-tab');
    switchIconTab(tabName);
  });
});

// 图标URL加载事件
loadIconUrl.addEventListener('click', handleIconUrlLoad);
iconUrlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleIconUrlLoad();
  }
});

// 点击模态框外部关闭
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    hideSettingsModal();
  }
});

// 回车键添加网站
modalUrlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addWebsiteFromModal();
  }
});

// 初始化设置
chrome.storage.sync.get(['showDomain'], (res) => {
  showDomainToggle.checked = res.showDomain !== false; // 默认显示
});

// 搜索引擎配置
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
    name: '百度',
    icon: 'https://www.baidu.com/favicon.ico',
    url: 'https://www.baidu.com/s?wd='
  },
  yandex: {
    name: 'Yandex',
    icon: 'https://yandex.com/favicon.ico',
    url: 'https://yandex.com/search/?text='
  }
};

// 当前搜索引擎
let currentSearchEngine = 'google';

// 搜索功能相关逻辑
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchEngineSelect = document.getElementById('searchEngineSelect');
const searchEngineIndicator = document.getElementById('searchEngineIndicator');
const searchEngineIcon = document.getElementById('searchEngineIcon');

// 更新搜索引擎显示
function updateSearchEngineDisplay() {
  const engine = searchEngines[currentSearchEngine];
  searchEngineIcon.src = engine.icon;
}

// 处理搜索/导航
function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) return;
  
  // 检查是否是网址
  let url;
  let isUrl = false;
  
  try {
    // 尝试直接解析为URL
    url = new URL(query);
    isUrl = true;
  } catch {
    // 如果不是完整URL，检查是否可能是域名
    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (domainPattern.test(query)) {
      // 看起来像域名，尝试添加协议
      try {
        url = new URL('https://' + query);
        isUrl = true;
      } catch {
        // 不是有效域名
        isUrl = false;
      }
    } else {
      // 不是域名格式，进行搜索
      isUrl = false;
    }
  }
  
  // 如果是网址，直接导航
  if (isUrl && url) {
    window.location.href = url.href;
    return;
  }
  
  // 否则使用当前搜索引擎进行搜索
  const engine = searchEngines[currentSearchEngine];
  const searchUrl = engine.url + encodeURIComponent(query);
  window.location.href = searchUrl;
}

// 切换搜索引擎
function changeSearchEngine() {
  currentSearchEngine = searchEngineSelect.value;
  chrome.storage.sync.set({ searchEngine: currentSearchEngine }, () => {
    updateSearchEngineDisplay();
  });
}

// 搜索事件监听
searchBtn.addEventListener('click', handleSearch);

// 回车键搜索
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleSearch();
  }
});

// 搜索引擎选择事件
searchEngineSelect.addEventListener('change', changeSearchEngine);

// 搜索引擎下拉菜单相关
const searchEngineDropdown = document.getElementById('searchEngineDropdown');

function showSearchEngineDropdown() {
  // 构建下拉菜单内容
  searchEngineDropdown.innerHTML = '';
  Object.entries(searchEngines).forEach(([key, engine]) => {
    const btn = document.createElement('button');
    btn.className = 'engine-option' + (currentSearchEngine === key ? ' selected' : '');
    btn.innerHTML = `<img src="${engine.icon}" style="width:20px;height:20px;vertical-align:middle;border-radius:4px;margin-right:8px;">${engine.name}`;
    btn.onclick = () => {
      currentSearchEngine = key;
      chrome.storage.sync.set({ searchEngine: currentSearchEngine }, () => {
        updateSearchEngineDisplay();
      });
      // 同步设置面板的select选项
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

function hideSearchEngineDropdown(e) {
  if (!searchEngineDropdown.contains(e.target) && e.target.id !== 'searchEngineIndicator' && e.target.id !== 'searchEngineIcon') {
    searchEngineDropdown.style.display = 'none';
  }
}

// 替换原有alert事件
searchEngineIndicator.onclick = showSearchEngineDropdown;

// 页面加载时聚焦到搜索框
document.addEventListener('DOMContentLoaded', () => {
  searchInput.focus();
});

// 点击页面其他地方时聚焦到搜索框
document.addEventListener('click', (e) => {
  // 如果点击的不是搜索框、搜索按钮或设置按钮，则聚焦到搜索框
  if (!e.target.closest('.search-container') && 
      !e.target.closest('#settingsBtn') && 
      !e.target.closest('#themeToggleWrapper') &&
      !e.target.closest('#settingsModal')) {
    searchInput.focus();
  }
});

// 初始化搜索引擎设置
chrome.storage.sync.get(['searchEngine'], (res) => {
  currentSearchEngine = res.searchEngine || 'google';
  searchEngineSelect.value = currentSearchEngine;
  updateSearchEngineDisplay();
});

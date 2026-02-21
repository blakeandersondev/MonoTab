export function getFavicon(url, customIcon = null) {
  if (customIcon) {
    return customIcon;
  }

  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return 'icons/icon128.png';
  }
}

export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function formatUrl(input) {
  try {
    return new URL(input).href;
  } catch {
    try {
      return new URL(`https://${input}`).href;
    } catch {
      return null;
    }
  }
}

export async function getWebsiteTitle(url) {
  try {
    const urlObj = new URL(url);
    let title = urlObj.hostname.replace(/^www\./, '');

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

    for (const [domain, siteName] of Object.entries(knownSites)) {
      if (title.includes(domain)) {
        return siteName;
      }
    }

    const domainParts = title.split('.');
    if (domainParts.length >= 2) {
      const mainDomain = domainParts[domainParts.length - 2];
      return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
    }

    return title;
  } catch {
    return '新网站';
  }
}

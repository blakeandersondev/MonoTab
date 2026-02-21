const themeBtn = document.getElementById('themeToggleBtn');

function setTheme(mode) {
  document.body.classList.remove('light-mode', 'dark-mode');
  document.body.classList.add(mode);

  const moon = document.getElementById('moonIcon');
  const sunGroup = document.getElementById('sunGroup');

  if (mode === 'light-mode') {
    if (moon) {
      moon.style.display = 'inline';
    }
    if (sunGroup) {
      sunGroup.style.display = 'none';
    }
  } else {
    if (moon) {
      moon.style.display = 'none';
    }
    if (sunGroup) {
      sunGroup.style.display = 'inline';
    }
  }

  localStorage.setItem('monoTabTheme', mode);
}

export function initTheme() {
  const savedTheme = localStorage.getItem('monoTabTheme');
  setTheme(savedTheme === 'dark-mode' ? 'dark-mode' : 'light-mode');

  themeBtn.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-mode');
    setTheme(isLight ? 'dark-mode' : 'light-mode');
  });
}

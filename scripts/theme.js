// scripts/theme.js

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('site-theme', theme);
  console.log(`[THEME] Установлена тема: ${theme}`);

  // Генерируем событие для возможной синхронизации с другими модулями (например, ui-theme.js)
  const event = new CustomEvent('siteThemeChanged', { detail: theme });
  window.dispatchEvent(event);
}

function getPreferredTheme() {
  const saved = localStorage.getItem('site-theme');
  if (saved) {
    console.log(`[THEME] Тема из localStorage: ${saved}`);
    return saved;
  }
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  console.log(`[THEME] Тема по умолчанию (система): ${prefersDark ? 'dark' : 'light'}`);
  return prefersDark ? 'dark' : 'light';
}

document.addEventListener('DOMContentLoaded', () => {
  setTheme(getPreferredTheme());

  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const newTheme = current === 'dark' ? 'light' : 'dark';
      console.log(`[THEME] Переключение темы по клику: ${current} → ${newTheme}`);
      setTheme(newTheme);
    });
  } else {
    console.warn('[THEME] Кнопка с id "themeToggle" не найдена');
  }

  const mql = window.matchMedia('(prefers-color-scheme: dark)');

  const systemThemeChange = e => {
    if (!localStorage.getItem('site-theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      console.log(`[THEME] Системная тема изменилась, обновляем: ${newTheme}`);
      setTheme(newTheme);
    }
  };

  if (mql.addEventListener) {
    mql.addEventListener('change', systemThemeChange);
  } else if (mql.addListener) {
    mql.addListener(systemThemeChange);
  }
});

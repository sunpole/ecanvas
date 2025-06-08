// scripts/theme.js
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('site-theme', theme);
}
function getPreferredTheme() {
  return localStorage.getItem('site-theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

document.addEventListener('DOMContentLoaded', () => {
  setTheme(getPreferredTheme());
  const btn = document.getElementById('themeToggle');
  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(isDark ? 'light' : 'dark');
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('site-theme')) setTheme(e.matches ? 'dark' : 'light');
  });
});

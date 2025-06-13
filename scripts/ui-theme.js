// scripts/ui-theme.js

/**
 * Определение всех тем
 */
const THEMES = {
  light: {
    background: '#f8f8f8',
    grid: '#dddddd',
    outline: '#333333',
    spawn: '#32a852',
    exit: '#e94242',
    module: '#2677c9',
    order: '#f6a700',
    text: '#232323',
  },
  dark: {
    background: '#242c3a',
    grid: '#3a3f4a',
    outline: '#cfd2d6',
    spawn: '#00c853',
    exit: '#ff5252',
    module: '#4fc3f7',
    order: '#ffb300',
    text: '#f1f1f1',
  }
};

// === Переменные темы ===
let currentThemeName = detectSystemTheme();
export let UI_COLORS = { ...THEMES[currentThemeName] };

/**
 * Используемые шрифты
 */
export const UI_FONTS = {
  main: '16px "Segoe UI", Arial, sans-serif',
  small: '12px "Segoe UI", Arial, sans-serif'
};

/**
 * Применить тему к canvas
 */
export function applyUITheme(ctx) {
  if (!ctx) return;
  ctx.font = UI_FONTS.main;
  ctx.fillStyle = UI_COLORS.text;
  console.log(`[UI-THEME] Применена тема "${currentThemeName}"`);
}

/**
 * Сменить тему вручную
 */
export function switchTheme(themeName) {
  if (!THEMES[themeName]) {
    console.warn(`[UI-THEME] Тема "${themeName}" не найдена`);
    return;
  }

  currentThemeName = themeName;
  UI_COLORS = { ...THEMES[themeName] };
  console.log(`[UI-THEME] Смена темы: "${themeName}"`);

  // После смены — можно вызывать перерисовку UI, если нужно
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('themeChanged', { detail: themeName });
    window.dispatchEvent(event);
  }
}

/**
 * Определить системную тему при старте
 */
function detectSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    if (prefersDark.matches) {
      console.log('[UI-THEME] Обнаружена системная тема: dark');
      return 'dark';
    }
  }

  console.log('[UI-THEME] Обнаружена системная тема: light (по умолчанию)');
  return 'light';
}

/**
 * Получить текущую тему
 */
export function getCurrentTheme() {
  return currentThemeName;
}

/**
 * Следим за сменой системной темы
 */
if (typeof window !== 'undefined' && window.matchMedia) {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', e => {
    const newTheme = e.matches ? 'dark' : 'light';
    console.log(`[UI-THEME] Смена системной темы: ${newTheme}`);
    switchTheme(newTheme);
  });
}

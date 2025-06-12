// scripts/ui-theme.js

/**
 * Названия и значения цветовой схемы UI
 */
export const UI_COLORS = {
  background: '#f8f8f8',
  grid: '#dddddd',
  outline: '#333333',
  spawn: '#32a852',
  exit: '#e94242',
  module: '#2677c9',
  order: '#f6a700',
  text: '#232323',
};

/**
 * Используемые шрифты интерфейса
 */
export const UI_FONTS = {
  main: '16px "Segoe UI", Arial, sans-serif',
  small: '12px "Segoe UI", Arial, sans-serif'
};

/**
 * Применить тему к канвасу (можно дорабатывать)
 */
export function applyUITheme(ctx) {
  console.log('[UI-THEME] applyUITheme вызвана');
  // Здесь можно менять стили Canvas перед рендером
  ctx.font = UI_FONTS.main;
  ctx.fillStyle = UI_COLORS.text;
}

/**
 * Функция для смены темы (заглушка)
 */
export function switchTheme(themeName) {
  console.log('[UI-THEME] switchTheme, тема:', themeName);
  // TODO: переключить значения UI_COLORS, если тем несколько
}

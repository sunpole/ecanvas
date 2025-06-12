// scripts/ui.js

/**
 * Отрисовать статичный интерфейс (панели, счетчики и пр.)
 */
export function renderUI(ctx, gameState) {
  console.log('[UI] renderUI вызвана');
  // TODO: нарисовать интерфейс на канвасе или DOM на основе gameState
  // Пример: ctx.fillText(`Счёт: ${gameState.score}`, 20, 30);
}

/**
 * Обновить данные интерфейса (например, счет или сообщения)
 */
export function updateUI(gameState) {
  console.log('[UI] updateUI вызвана');
  // TODO: обновить внутренние переменные/DOM-элементы интерфейса
}

/**
 * Показать всплывающее сообщение
 */
export function showMessage(text, duration = 2000) {
  console.log('[UI] showMessage:', text, 'на', duration, 'мс');
  // TODO: показать сообщение игроку на заданное время
}

/**
 * Обработчик кликов/событий по UI
 */
export function handleUIClick(x, y) {
  console.log('[UI] handleUIClick:', x, y);
  // TODO: реализовать обработку кликов по кнопкам интерфейса
}

/**
 * Инициализация интерфейса (DOM или Canvas)
 */
export function initUI() {
  console.log('[UI] initUI вызвана');
  // TODO: создать DOM-элементы, навесить обработчики и т.п.
}

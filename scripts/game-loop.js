// scripts/game-loop.js

// Основной игровой цикл и связанная логика

/**
 * Главный игровой цикл
 */
export function gameLoop(timestamp) {
  // TODO: реализовать основной цикл игры
  console.log('[GAME-LOOP] gameLoop работает с timestamp:', timestamp);
  updateAll();
  renderAll();
  requestAnimationFrame(gameLoop);
}

/**
 * Обновление состояния всех объектов за кадр
 */
export function updateAll() {
  // TODO: обновить все игровые объекты
  console.log('[GAME-LOOP] updateAll');
}

/**
 * Отрисовка всех объектов за кадр
 */
export function renderAll() {
  // TODO: нарисовать все нужное на экране
  console.log('[GAME-LOOP] renderAll');
}

/**
 * Старт игры
 */
export function startGame() {
  console.log('[GAME-LOOP] startGame — игра запущена');
  requestAnimationFrame(gameLoop);
}

/**
 * Пауза игры
 */
export function pauseGame() {
  console.log('[GAME-LOOP] pauseGame — игра на паузе');
  // Здесь логика паузы (в базовом шаблоне не реализована)
}

// scripts/game-loop.js

import { orders, updateOrderPosition, renderOrder, cleanupDeadOrders } from './orders.js';
import { loadOrderPresets, startWave, isWaveFinished } from './spawner.js';
import { drawGrid } from './renderer.js';
import { modules, renderModule, updateModules } from './modules.js'; // добавил updateModules

let lastTimestamp = 0;

/**
 * Главный игровой цикл
 */
export function gameLoop(timestamp) {
  const delta = (timestamp - lastTimestamp) / 1000 || 0.016; // секунды между кадрами
  lastTimestamp = timestamp;

  updateAll(delta);
  renderAll();

  if (isWaveFinished()) {
    // Обработка конца волны (пока заглушка)
    console.log('[GAME-LOOP] Волна завершена');
    // Здесь можно запускать следующую волну, показывать модалки и т.п.
    // Например: startWave(следующая_волна);
    // Для паузы просто не вызывай requestAnimationFrame
  } else {
    requestAnimationFrame(gameLoop);
  }
}

/**
 * Обновление состояния всех объектов за кадр
 */
export function updateAll(delta) {
  // Двигаем всех живых врагов (orders)
  for (const order of orders) {
    if (!order.dead) updateOrderPosition(order, delta);
  }
  cleanupDeadOrders();

  // Обновляем модули (башни)
  updateModules(delta, orders);
}

/**
 * Отрисовка всех объектов за кадр
 */
export function renderAll() {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  drawGrid(ctx);

  // Отрисовать модули (башни)
  for (const module of modules) {
    renderModule(module, ctx);
  }

  // Отрисовать врагов
  for (const order of orders) {
    renderOrder(order, ctx);
  }
}

/**
 * Запуск игры — инициализация и старт первой волны
 */
export async function startGame() {
  console.log('[GAME-LOOP] startGame — игра запущена');
  await loadOrderPresets();

  // Запускаем первую волну (пример)
  startWave({
    orders: [
      { id: 'vip', count: 1 }
      // можно добавить другие типы врагов
    ]
  });

  requestAnimationFrame(gameLoop);
}

/**
 * Пауза игры (заглушка)
 */
export function pauseGame() {
  console.log('[GAME-LOOP] pauseGame — игра на паузе');
}

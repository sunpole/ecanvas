// scripts/game-loop.js

import { orders, updateOrderPosition, renderOrder, cleanupDeadOrders } from './orders.js';
import { loadOrderPresets, startWave, isWaveFinished } from './spawner.js';
import { drawGrid } from './renderer.js';
import { modules, renderModule } from './modules.js';   // towers.js (должен быть modules.js) должен экспортировать этот набор

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
    // place to handle end of wave: auto-next, modal, victory, etc.
    // Например: startWave(следующая_волна); или показать modal("Волна завершена!")
    // Можно для разработки просто паузу:
    // return; // или не вызывать requestAnimationFrame для паузы
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

  // Здесь можно добавить апдейт для башен, если требуется (например, для зарядки, пуль или анимаций)
  // for (const tower of towers) { updateTower(tower, delta); }
}

/**
 * Отрисовка всех объектов за кадр
 */
export function renderAll() {
  drawGrid();

  // Отрисовать башни, если есть towers.js и renderTower:
  if (typeof renderTower === "function" && Array.isArray(towers)) {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    for (const tower of towers) {
      renderTower(tower, ctx);
    }
  }

  // Отрисовать врагов
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  for (const order of orders) {
    renderOrder(order, ctx);
  }
}

/**
 * Старт всей игры (инициализация пресетов, волны, поля и первого запроса animationFrame)
 */
export async function startGame() {
  console.log('[GAME-LOOP] startGame — игра запущена');
  await loadOrderPresets();

  // Запуск первой волны
  startWave({
    orders: [
      { id: 'vip', count: 1 }
      // добавь другие типы врагов при необходимости
    ]
  });

  requestAnimationFrame(gameLoop);
}

/**
 * Пауза игры
 */
export function pauseGame() {
  // Пока только заглушка
  console.log('[GAME-LOOP] pauseGame — игра на паузе');
}

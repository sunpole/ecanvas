// scripts/game-loop.js

import { orders, updateOrderPosition, renderOrder, cleanupDeadOrders } from './orders.js';
import { loadOrderPresets, startWave, tickSpawner, isWaveFinished } from './spawner.js';
import { renderGrid } from './renderer.js';

let lastTimestamp = 0;

/**
 * Главный игровой цикл
 */
export function gameLoop(timestamp) {
  const delta = (timestamp - lastTimestamp) / 1000 || 0.016; // секунды между кадрами
  lastTimestamp = timestamp;

  updateAll(delta);
  renderAll();
  requestAnimationFrame(gameLoop);

  // Проверяем окончание волны (простая демонстрация)
  if (isWaveFinished()) {
    // Тут можно либо стартовать следующую волну, либо остановить, показать экран победы и т.д.
    // Например:
    // startWave(следующая_волна);
    // или пауза, диалог, ...
  }
}

/**
 * Обновление состояния всех объектов за кадр
 */
export function updateAll(delta) {
  // Спауним новых врагов (tickSpawner работает через setInterval, но можешь сделать и тут)
  // tickSpawner(); НЕ ОБЯЗАТЕЛЬНО если уже setInterval в spawner.js

  // Двигаем всех живых orders
  for (const order of orders) {
    if (!order.dead) updateOrderPosition(order, delta);
  }
  // Удаляем "трупы"
  cleanupDeadOrders();
}

/**
 * Отрисовка всех объектов за кадр
 */
export function renderAll() {
  // Сначала рендерим сетку (поле)
  renderGrid();

  // Потом все активные заказы (враги)
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

  // Можно выводить уровень, UI, и т.д.

  // Запуск первой волны — простая заглушка на демонстрацию:
  startWave({
    orders: [
      { id: 'vip', count: 1 }
      // здесь потом можешь добавлять любые другие виды и количества order'ов
    ]
  });

  requestAnimationFrame(gameLoop);
}

/**
 * Пауза игры
 */
export function pauseGame() {
  // Для MVP можно просто ничего не делать
  console.log('[GAME-LOOP] pauseGame — игра на паузе');
}

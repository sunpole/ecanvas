// scripts/orders.js

import { findPath, recalculatePath } from './pathfinding.js';
import { grid } from './grid.js';
import { logDebug } from './utils.js';

// Хранилище всех активных order’ов (врагов/юнитов) на карте
export const orders = [];

let ORDER_ID = 1; // внутренний счетчик для уникальных id

/**
 * Создать и разместить новый order (враг/юнит) по данным шаблона orderData
 */
export function spawnOrder(orderData) {
  const path = findPath(orderData.spawn, orderData.exit);
  if (!path) {
    logDebug('[ORDERS] spawnOrder: путь не найден для', orderData);
    return false;
  }
  const order = {
    id: ORDER_ID++,
    row: orderData.spawn.row,
    col: orderData.spawn.col,
    path,               // Массив клеток пути до выхода
    pathIndex: 0,       // Индекс текущего шага по маршруту
    hp: orderData.hp || 10,
    maxHp: orderData.hp || 10,
    dead: false,
    speed: orderData.speed || 1,  // Клеток в тик (или можно часть клетки — float)
    progress: 0, // Для плавности движения
    ...orderData
  };
  orders.push(order);
  logDebug('[ORDERS] Новый order создан:', order);
  return order;
}

/**
 * Одна итерация движения “заказа” по своему маршруту (перемещение, столкновения и т.п.)
 * timeDelta — шаг времени игры (для анимации/ускорения)
 */
export function updateOrderPosition(order, timeDelta = 1) {
  if (order.dead || !order.path || order.pathIndex >= order.path.length - 1) return;
  // Для плавности: двигаемся по клеткам с учетом скорости (speed — клетки в секунду)
  order.progress += order.speed * timeDelta;
  while (order.progress >= 1 && order.pathIndex < order.path.length - 1) {
    order.pathIndex++;
    order.row = order.path[order.pathIndex].row;
    order.col = order.path[order.pathIndex].col;
    order.progress -= 1;
  }
  // Достигли финиша?
  if (order.pathIndex === order.path.length - 1) {
    orderReachedEnd(order);
  }
}

/**
 * Нарисовать единичный order на Canvas (ctx)
 */
export function renderOrder(order, ctx, cellSize = 40) {
  if (order.dead) return;
  // Опционально: более красиво можно через спрайты, но для MVP — кружочек/квадратик
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = order.color || '#2e90ff';
  const x = order.col * cellSize;
  const y = order.row * cellSize;
  ctx.beginPath();
  ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 3, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Жизни (HP) в виде полоски сверху
  if (order.hp < order.maxHp) {
    ctx.fillStyle = '#f22';
    ctx.fillRect(x + 5, y + 5, (cellSize - 10) * (order.hp / order.maxHp), 4);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x + 5, y + 5, cellSize - 10, 4);
  }
}

/**
 * Когда враг доходит до выхода — вызывается это событие
 * (уменьшение счетчика жизней игрока, проигрыш, удаление юнита и др.)
 */
export function orderReachedEnd(order) {
  logDebug('[ORDERS] orderReachedEnd:', order.id);
  order.dead = true;
  // TODO — обработать: уменьшить жизнь игрока, проигрыш и т.д.
}

/**
 * Повреждение order’а (например, от башни/удара)
 */
export function orderTakeDamage(order, amount) {
  if (order.dead) return;
  order.hp -= amount;
  if (order.hp <= 0) {
    order.dead = true;
    logDebug("[ORDERS] Order", order.id, "уничтожен");
    // Можно добавить анимацию взрыва, звук и др.
  }
}

/**
 * Удалить всех погибших orders из массива
 */
export function cleanupDeadOrders() {
  for (let i = orders.length - 1; i >= 0; i--) {
    if (orders[i].dead) orders.splice(i, 1);
  }
}

// scripts/spawner.js

import { spawnOrder, orders } from './orders.js';
import { SPAWN_CELLS, EXIT_CELLS } from './config.js';

let PRESETS = {};          // хранилище шаблонов врагов
let orderQueue = [];       // очередь врагов на волну
let currentWave = null;
let spawnIntervalMs = 1000;
let spawnTimer = null;

// 1. Загрузка пресетов врагов из orders.json
export async function loadOrderPresets() {
  const response = await fetch('data/orders.json');
  const json = await response.json();
  for (const order of json.orders) {
    PRESETS[order.id] = order;
  }
  // Можно сохранить constants из json.constants, если нужно, например default_hp и т.д.
}

// 2. Для получения шаблона по id из PRESERS
function getPresetById(id) {
  return PRESETS[id];
}

// 3. Запуск новой волны врагов
export function startWave(waveData) {
  console.log('[SPAWNER] startWave:', waveData);
  currentWave = waveData;
  orderQueue = queueOrders(waveData);
  clearInterval(spawnTimer);
  spawnTimer = setInterval(tickSpawner, spawnIntervalMs);
}

// 4. Генерация очереди врагов для волны
export function queueOrders(waveData) {
  const result = [];
  waveData.orders.forEach(orderGroup => {
    for (let i = 0; i < orderGroup.count; i++) {
      result.push(orderGroup.id);
    }
  });
  return result;
}

// 5. Тикер спауна врагов из очереди
export function tickSpawner() {
  if (!orderQueue.length) {
    clearInterval(spawnTimer);
    return;
  }
  // Для простоты — используем первую спавн-клетку и первую exit-клетку
  const spawnCell = SPAWN_CELLS[0];
  const exitCell = EXIT_CELLS[0];

  const orderId = orderQueue.shift();
  const preset = getPresetById(orderId);
  if (!preset) {
    console.warn(`[SPAWNER] Неизвестный ID врага: ${orderId}`);
    return;
  }
  spawnOrder({
    ...preset,
    spawn: { row: spawnCell.row, col: spawnCell.col },
    exit: { row: exitCell.row, col: exitCell.col }
  });
}

// 6. Проверка: все ли из этой волны ушли/убиты («волна завершена»)
export function isWaveFinished() {
  return orderQueue.length === 0 && orders.every(o => o.dead);
}

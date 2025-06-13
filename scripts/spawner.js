// scripts/spawner.js

import { spawnOrder, orders } from './orders.js';
import { SPAWN_CELLS, EXIT_CELLS } from './config.js';

let PRESETS = {};          // Хранилище шаблонов врагов
let orderQueue = [];       // Очередь врагов для текущей волны
let currentWave = null;
let spawnIntervalMs = 1000;
let spawnTimer = null;

/**
 * Загрузить пресеты врагов из data/orders.json
 * Вызывать обязательно ДО запуска волн!
 */
export async function loadOrderPresets() {
  try {
    const response = await fetch('data/orders.json');
    if (!response.ok) {
      console.error(`[SPAWNER] Ошибка загрузки orders.json: ${response.status} ${response.statusText}`);
      return;
    }
    const json = await response.json();
    if (!json.orders || !Array.isArray(json.orders)) {
      console.error('[SPAWNER] Некорректный формат orders.json: отсутствует поле orders');
      return;
    }
    for (const order of json.orders) {
      if (!order.id) {
        console.warn('[SPAWNER] Найден пресет без id:', order);
        continue;
      }
      PRESETS[order.id] = order;
    }
    console.log('[SPAWNER] Пресеты врагов загружены:', Object.keys(PRESETS));
  } catch (error) {
    console.error('[SPAWNER] Ошибка при загрузке пресетов врагов:', error);
  }
}

/**
 * Получить пресет по id
 * @param {string} id - ID врага
 * @returns {object|undefined}
 */
export function getPresetById(id) {
  return PRESETS[id];
}

/**
 * Запуск новой волны с параметрами волны
 * @param {object} waveData - объект волны с массивом orders [{id, count}, ...]
 */
export function startWave(waveData) {
  if (!waveData || !waveData.orders) {
    console.error('[SPAWNER] startWave: некорректные данные волны', waveData);
    return;
  }
  console.log('[SPAWNER] Запуск волны:', waveData);
  currentWave = waveData;
  orderQueue = queueOrders(waveData);
  if (spawnTimer) {
    clearInterval(spawnTimer);
    spawnTimer = null;
  }
  spawnTimer = setInterval(tickSpawner, spawnIntervalMs);
}

/**
 * Сформировать очередь врагов из данных волны
 * @param {object} waveData
 * @returns {string[]} - массив ID врагов
 */
export function queueOrders(waveData) {
  const result = [];
  waveData.orders.forEach(orderGroup => {
    if (!orderGroup.id || typeof orderGroup.count !== 'number') {
      console.warn('[SPAWNER] Некорректная группа врагов в волне:', orderGroup);
      return;
    }
    for (let i = 0; i < orderGroup.count; i++) {
      result.push(orderGroup.id);
    }
  });
  console.log('[SPAWNER] Очередь врагов сформирована:', result);
  return result;
}

/**
 * Функция-тикер, спавнит врагов из очереди по таймеру
 */
export function tickSpawner() {
  if (!orderQueue.length) {
    if (spawnTimer) {
      clearInterval(spawnTimer);
      spawnTimer = null;
    }
    console.log('[SPAWNER] Волна завершена, спавн остановлен');
    return;
  }
  
  // Берём первую спавн-клетку и первую exit-клетку (можно расширить логику позже)
  const spawnCell = SPAWN_CELLS[0];
  const exitCell = EXIT_CELLS[0];

  const orderId = orderQueue.shift();
  const preset = getPresetById(orderId);

  if (!preset) {
    console.warn(`[SPAWNER] Неизвестный ID врага при спавне: ${orderId}`);
    return;
  }

  // Добавляем координаты спавна и выхода
  spawnOrder({
    ...preset,
    spawn: { row: spawnCell.row, col: spawnCell.col },
    exit: { row: exitCell.row, col: exitCell.col }
  });

  console.log(`[SPAWNER] Спавн врага ID=${orderId} на клетке (${spawnCell.row},${spawnCell.col})`);
}

/**
 * Проверка, завершена ли волна
 * @returns {boolean}
 */
export function isWaveFinished() {
  const finished = orderQueue.length === 0 && orders.every(o => o.dead);
  console.log(`[SPAWNER] Проверка завершения волны: ${finished ? 'Завершена' : 'Ещё идёт'}`);
  return finished;
}

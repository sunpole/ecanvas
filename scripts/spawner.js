// scripts/spawner.js

import { spawnOrder, orders } from './orders.js';
import { SPAWN_CELLS, EXIT_CELLS } from './config.js';

let PRESETS = {};          // Хранилище шаблонов врагов (пресетов)
let orderQueue = [];       // Очередь врагов для текущей волны (ID врагов)
let currentWave = null;
const spawnIntervalMs = 1000;
let spawnTimer = null;

/**
 * Загрузить пресеты врагов из data/orders.json
 * Вызывать обязательно ДО запуска волн!
 * @returns {Promise<void>}
 */
export async function loadOrderPresets() {
  try {
    console.log('[SPAWNER] Начинается загрузка пресетов врагов из data/orders.json');
    const response = await fetch('data/orders.json');
    if (!response.ok) {
      console.error(`[SPAWNER] Ошибка загрузки orders.json: ${response.status} ${response.statusText}`);
      return;
    }
    const json = await response.json();
    if (!json.orders || !Array.isArray(json.orders)) {
      console.error('[SPAWNER] Некорректный формат orders.json: отсутствует поле orders или оно не массив');
      return;
    }
    PRESETS = {}; // Очистка перед загрузкой
    if (json.orders.length === 0) {
      console.warn('[SPAWNER] В orders.json нет пресетов врагов');
    }
    for (const order of json.orders) {
      if (!order.id) {
        console.warn('[SPAWNER] Найден пресет без id:', order);
        continue;
      }
      PRESETS[order.id] = order;
    }
    console.log('[SPAWNER] Пресеты врагов успешно загружены:', Object.keys(PRESETS));
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
 * Сброс состояния спавнера (очистка очереди, волны, остановка таймера)
 */
export function resetSpawner() {
  if (spawnTimer) {
    clearInterval(spawnTimer);
    spawnTimer = null;
  }
  orderQueue = [];
  currentWave = null;
  console.log('[SPAWNER] Спавнер сброшен');
}

/**
 * Запуск новой волны с параметрами волны
 * @param {object} waveData - объект волны с массивом orders [{id, count}, ...]
 */
export function startWave(waveData) {
  if (!waveData || !waveData.orders || !Array.isArray(waveData.orders)) {
    console.error('[SPAWNER] startWave: некорректные данные волны', waveData);
    return;
  }

  if (spawnTimer) {
    console.warn('[SPAWNER] Волна уже идет, текущий спавн будет остановлен и начнется новая волна');
    clearInterval(spawnTimer);
    spawnTimer = null;
  }

  if (!SPAWN_CELLS.length || !EXIT_CELLS.length) {
    console.error('[SPAWNER] Ошибка: отсутствуют координаты SPAWN_CELLS или EXIT_CELLS, волна не может быть запущена');
    return;
  }

  console.log('[SPAWNER] Запуск волны:', waveData);
  currentWave = waveData;
  orderQueue = queueOrders(waveData);

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
    if (!orderGroup.id || typeof orderGroup.count !== 'number' || orderGroup.count <= 0) {
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

  const spawnCell = SPAWN_CELLS[0];
  const exitCell = EXIT_CELLS[0];

  if (!spawnCell || !exitCell) {
    console.error('[SPAWNER] Ошибка: отсутствуют координаты для спавна или выхода');
    return;
  }

  const orderId = orderQueue.shift();
  const preset = getPresetById(orderId);

  if (!preset) {
    console.warn(`[SPAWNER] Неизвестный ID врага при спавне: ${orderId}`);
    return;
  }

  spawnOrder({
    ...preset,
    spawn: { row: spawnCell.row, col: spawnCell.col },
    exit: { row: exitCell.row, col: exitCell.col }
  });

  console.log(`[SPAWNER] Спавн врага ID=${orderId} на клетке (${spawnCell.row},${spawnCell.col}), осталось в очереди: ${orderQueue.length}`);
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

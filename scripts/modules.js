// scripts/modules.js

/** 
 * @typedef {Object} Module
 * @property {string} id
 * @property {number} row
 * @property {number} col
 * @property {string} type
 * @property {number} level
 * @property {number} attack
 * @property {number} range
 * @property {number} cooldown
 * @property {string} color
 * @property {number} lastAct
 * @property {number} upgTotal
 * @property {number} upgDone
 * @property {boolean} upgrading
 * 
 * @typedef {Object} Order
 * @property {number} row
 * @property {number} col
 * @property {number} hp
 * @property {boolean} dead
 */

export const modules = [];

const CELL_SIZE = 32;             // Размер клетки для отрисовки
const UPGRADE_TIME = 2;           // Время апгрейда в секундах

const MODULE_TYPES = {
  basic: {
    name: 'Стандарт',
    color: '#39c792',
    attack: 18,
    range: 2,
    cooldown: 1.2,
    upgradeCost: 30,
    upgradeAttack: 7,
    maxLevel: 4
  },
  fast: {
    name: 'Быстрая',
    color: '#2db3fd',
    attack: 12,
    range: 2,
    cooldown: 0.7,
    upgradeCost: 40,
    upgradeAttack: 5,
    maxLevel: 4
  }
};

/**
 * Получить параметры модуля по типу
 * @param {string} type
 * @returns {Object}
 */
function getModuleParams(type) {
  const params = MODULE_TYPES[type];
  if (!params) {
    console.debug(`[MODULES][DEBUG] Тип модуля "${type}" не найден, используем "basic"`);
  }
  return params || MODULE_TYPES['basic'];
}

/**
 * Генерация уникального ID
 * @returns {string}
 */
function generateId() {
  // Можно добавить улучшенный UUID, но для игры этого достаточно
  return Math.random().toString(36).slice(2) + Date.now();
}

/**
 * Проверить валидность размещения модуля
 * @param {number} row
 * @param {number} col
 * @returns {boolean}
 */
function isPlaceValid(row, col) {
  if (modules.some(m => m.row === row && m.col === col)) {
    console.debug(`[MODULES][DEBUG] Место (${row},${col}) занято другим модулем`);
    return false;
  }
  // TODO: Проверить проходимость по сетке (grid.js)
  console.debug(`[MODULES][DEBUG] Место (${row},${col}) свободно для размещения`);
  return true;
}

/**
 * Разместить модуль на поле
 * @param {number} row
 * @param {number} col
 * @param {string} [type='basic']
 * @returns {boolean} успех размещения
 */
function placeModule(row, col, type = 'basic') {
  if (!isPlaceValid(row, col)) {
    console.warn(`[MODULES] Нельзя разместить модуль "${type}" на (${row},${col}) — место занято или недоступно`);
    return false;
  }
  const params = getModuleParams(type);

  const module = {
    id: generateId(),
    row,
    col,
    type,
    level: 1,
    attack: params.attack,
    range: params.range,
    cooldown: params.cooldown,
    color: params.color,
    lastAct: 0,              // Инициализируем 0, чтобы сразу мог начать считать время
    upgTotal: 0,
    upgDone: 0,
    upgrading: false
  };

  modules.push(module);
  console.log(`[MODULES] Установлен модуль: ID=${module.id}, Тип="${type}", Позиция=(${row},${col})`);
  return true;
}

/**
 * Запустить апгрейд модуля
 * @param {Module} module
 * @returns {boolean} успех
 */
function upgradeModule(module) {
  if (!modules.includes(module)) {
    console.error(`[MODULES] Попытка апгрейда неизвестного модуля ID=${module?.id || 'undefined'}`);
    return false;
  }
  if (module.upgrading) {
    console.warn(`[MODULES] Модуль ID=${module.id} уже в процессе апгрейда`);
    return false;
  }
  const params = getModuleParams(module.type);
  if (module.level >= params.maxLevel) {
    console.warn(`[MODULES] Модуль ID=${module.id} достиг максимального уровня (${module.level})`);
    return false;
  }

  module.upgTotal = UPGRADE_TIME;
  module.upgDone = 0;
  module.upgrading = true;
  console.log(`[MODULES] Запущен апгрейд модуля ID=${module.id}, Тип=${module.type}, уровень ${module.level} -> ${module.level + 1}`);
  return true;
}

/**
 * Обновить все модули (вызов в game-loop)
 * @param {number} delta - прошедшее время с прошлого обновления в секундах
 * @param {Order[]} orders - массив врагов
 */
function updateModules(delta, orders) {
  for (const module of modules) {
    if (module.upgrading) {
      module.upgDone += delta;
      console.debug(`[MODULES][DEBUG] Модуль ID=${module.id} апгрейд прогресс: ${module.upgDone.toFixed(2)} / ${module.upgTotal}`);
      if (module.upgDone >= module.upgTotal) {
        const params = getModuleParams(module.type);
        module.level++;
        module.attack += params.upgradeAttack;
        module.upgrading = false;
        module.upgTotal = 0;
        module.upgDone = 0;
        console.log(`[MODULES] Модуль ID=${module.id} прокачан до уровня ${module.level}`);
      }
      continue; // Апгрейд приоритетнее атаки
    }

    module.lastAct += delta;
    if (module.lastAct >= module.cooldown) {
      const targets = getModulesTargets(module, orders);
      if (targets.length) {
        dealDamage(module, targets[0]);
        module.lastAct = 0;
      } else {
        console.debug(`[MODULES][DEBUG] Модуль ID=${module.id} не нашёл целей в радиусе ${module.range}`);
      }
    }
  }
}

/**
 * Получить цели в радиусе действия модуля
 * @param {Module} module
 * @param {Order[]} orders
 * @returns {Order[]}
 */
function getModulesTargets(module, orders) {
  const radiusSquared = module.range * module.range;
  const targets = orders.filter(order =>
    !order.dead &&
    distanceSquared(module.row, module.col, order.row, order.col) <= radiusSquared
  );
  console.debug(`[MODULES][DEBUG] Модуль ID=${module.id} найдено целей: ${targets.length}`);
  return targets;
}

/**
 * Квадрат расстояния между двумя точками (без корня, для производительности)
 * @param {number} r1 
 * @param {number} c1 
 * @param {number} r2 
 * @param {number} c2 
 * @returns {number}
 */
function distanceSquared(r1, c1, r2, c2) {
  return (r1 - r2) ** 2 + (c1 - c2) ** 2;
}

/**
 * Нанесение урона модулем врагу
 * @param {Module} module 
 * @param {Order} order 
 */
function dealDamage(module, order) {
  const damage = module.attack;
  order.hp -= damage;
  if (order.hp < 0) order.hp = 0;
  console.log(`[MODULES] Модуль ID=${module.id} (${module.type}/${module.level}) атакует заказ (${order.row},${order.col}), урон: ${damage}, HP осталось: ${order.hp.toFixed(1)}`);

  if (order.hp === 0 && !order.dead) {
    order.dead = true;
    console.log(`[MODULES] Заказ (${order.row},${order.col}) уничтожен модулем ID=${module.id}`);
  }
}

/**
 * Получить все модули в радиусе вокруг врага (например, для ауры)
 * @param {Order} order 
 * @param {number} [radius=2] 
 * @returns {Module[]}
 */
function getModulesInRange(order, radius = 2) {
  const radiusSquared = radius * radius;
  const inRangeModules = modules.filter(module =>
    distanceSquared(module.row, module.col, order.row, order.col) <= radiusSquared
  );
  console.debug(`[MODULES][DEBUG] Найдено модулей в радиусе ${radius} вокруг заказа (${order.row},${order.col}): ${inRangeModules.length}`);
  return inRangeModules;
}

/**
 * Поиск модуля по координатам
 * @param {number} row 
 * @param {number} col 
 * @returns {Module|null}
 */
function getModuleAt(row, col) {
  const module = modules.find(m => m.row === row && m.col === col) || null;
  if (module) {
    console.debug(`[MODULES][DEBUG] Найден модуль ID=${module.id} на позиции (${row},${col})`);
  } else {
    console.debug(`[MODULES][DEBUG] Модуль на позиции (${row},${col}) не найден`);
  }
  return module;
}

/**
 * Отрисовка модуля на Canvas
 * @param {Module} module 
 * @param {CanvasRenderingContext2D} ctx 
 */
function renderModule(module, ctx) {
  ctx.fillStyle = module.color;
  ctx.fillRect(module.col * CELL_SIZE, module.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);

  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(module.level, module.col * CELL_SIZE + CELL_SIZE / 2, module.row * CELL_SIZE + CELL_SIZE / 2);
}

/**
 * Удалить модуль по координатам
 * @param {number} row 
 * @param {number} col 
 * @returns {boolean} успех удаления
 */
function removeModule(row, col) {
  const idx = modules.findIndex(m => m.row === row && m.col === col);
  if (idx !== -1) {
    console.log(`[MODULES] Модуль ID=${modules[idx].id} удалён с позиции: (${row},${col})`);
    modules.splice(idx, 1);
    return true;
  }
  console.warn(`[MODULES] Модуль на позиции (${row},${col}) не найден для удаления`);
  return false;
}

/**
 * Очистить все модули
 */
function resetModules() {
  modules.length = 0;
  console.log('[MODULES] Все модули очищены');
}

export {
  placeModule,
  upgradeModule,
  isPlaceValid,
  updateModules,
  getModulesInRange,
  getModuleAt,
  removeModule,
  resetModules,
  renderModule
};

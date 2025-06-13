// scripts/modules.js

export const modules = [];

const CELL_SIZE = 32;             // Размер клетки (используется для отрисовки)
const UPGRADE_TIME = 2;           // Время апгрейда в секундах (константа)

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

// Получение параметров по типу модуля
function getModuleParams(type) {
  return MODULE_TYPES[type] || MODULE_TYPES['basic'];
}

// Генерация уникального ID для модуля
function generateId() {
  return Math.random().toString(36).slice(2) + Date.now();
}

// Проверка валидности размещения модуля
function isPlaceValid(row, col) {
  if (modules.some(m => m.row === row && m.col === col)) {
    console.log(`[MODULES] Место занято: ${row},${col}`);
    return false;
  }
  // TODO: Проверить проходимость по сетке (grid.js)
  return true;
}

// Добавление модуля на поле
function placeModule(row, col, type = 'basic') {
  if (!isPlaceValid(row, col)) {
    console.warn(`[MODULES] Нельзя разместить модуль (${type}) на ${row},${col} — занято или недоступно`);
    return false;
  }
  const params = getModuleParams(type);
  const module = {
    id: generateId(),
    row, col,
    type,
    level: 1,
    attack: params.attack,
    range: params.range,
    cooldown: params.cooldown,
    color: params.color,
    lastAct: -Infinity,
    upgTotal: 0,
    upgDone: 0,
    upgrading: false
  };
  modules.push(module);
  console.log('[MODULES] Установлен модуль:', module);
  return true;
}

// Начало апгрейда модуля
function upgradeModule(module) {
  if (module.upgrading) {
    console.warn(`[MODULES] Модуль ${module.id} уже в процессе апгрейда`);
    return false;
  }
  const params = getModuleParams(module.type);
  if (module.level >= params.maxLevel) {
    console.warn(`[MODULES] Модуль ${module.id} достиг максимального уровня (${module.level})`);
    return false;
  }

  module.upgTotal = UPGRADE_TIME;
  module.upgDone = 0;
  module.upgrading = true;
  console.log(`[MODULES] Запущен апгрейд модуля (${module.type}) ${module.id} -> уровень ${module.level + 1}`);
  return true;
}

// Обновление всех модулей (вызывается в game-loop)
// delta — время с последнего вызова (в секундах)
// orders — массив текущих заказов (врагов)
function updateModules(delta, orders) {
  for (const module of modules) {
    if (module.upgrading) {
      module.upgDone += delta;
      if (module.upgDone >= module.upgTotal) {
        const params = getModuleParams(module.type);
        module.level++;
        module.attack += params.upgradeAttack;
        module.upgrading = false;
        module.upgTotal = 0;
        module.upgDone = 0;
        console.log(`[MODULES] Модуль ${module.id} прокачан до уровня ${module.level}`);
      }
      continue;
    }

    module.lastAct += delta;
    if (module.lastAct >= module.cooldown) {
      const targets = getModulesTargets(module, orders);
      if (targets.length) {
        dealDamage(module, targets[0]);
        module.lastAct = 0;
      }
    }
  }
}

// Получение целей в радиусе действия модуля
function getModulesTargets(module, orders) {
  return orders.filter(order =>
    !order.dead &&
    distanceSquared(module.row, module.col, order.row, order.col) <= module.range * module.range
  );
}

// Квадрат расстояния (без вычисления корня для производительности)
function distanceSquared(r1, c1, r2, c2) {
  return (r1 - r2) ** 2 + (c1 - c2) ** 2;
}

// Нанесение урона модулем врагу
function dealDamage(module, order) {
  order.hp -= module.attack;
  if (order.hp < 0) order.hp = 0;
  console.log(`[MODULES] Модуль (${module.type}/${module.level}) атакует заказ: ${order.row},${order.col}, урон: ${module.attack}, HP осталось: ${order.hp.toFixed(1)}`);
}

// Получение всех модулей в радиусе вокруг врага (например, для ауры)
function getModulesInRange(order, radius = 2) {
  return modules.filter(module =>
    distanceSquared(module.row, module.col, order.row, order.col) <= radius * radius
  );
}

// Поиск модуля по координатам
function getModuleAt(row, col) {
  return modules.find(m => m.row === row && m.col === col) || null;
}

// Отрисовка модуля на Canvas
function renderModule(module, ctx) {
  ctx.fillStyle = module.color;
  ctx.fillRect(module.col * CELL_SIZE, module.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);

  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(module.level, module.col * CELL_SIZE + CELL_SIZE / 2, module.row * CELL_SIZE + CELL_SIZE / 2);
}

// Удаление модуля с поля
function removeModule(row, col) {
  const idx = modules.findIndex(m => m.row === row && m.col === col);
  if (idx !== -1) {
    console.log(`[MODULES] Модуль ${modules[idx].id} удалён с позиции: ${row},${col}`);
    modules.splice(idx, 1);
    return true;
  }
  console.warn(`[MODULES] Модуль на позиции ${row},${col} не найден для удаления`);
  return false;
}

// Очистка всех модулей
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
